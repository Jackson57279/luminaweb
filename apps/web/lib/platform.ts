import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Database } from "bun:sqlite";
import {
  createHandler,
  MemoryDatabase,
  type CapsuleDef,
  type LogEntry,
} from "luminaweb-runtime/server/edge";

export type DeployRecord = {
  id: string;
  name: string;
  ownerId: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  public: number;
};

export type DistFile = {
  path: string;
  contentBase64: string;
};

const DATA_DIR = process.env.LUMINAWEB_DATA_DIR ?? process.env.ZAPDEV_DATA_DIR ?? resolve(process.cwd(), "data");
const DEPLOYS_DIR = join(DATA_DIR, "deploys");
mkdirSync(DEPLOYS_DIR, { recursive: true });

let _platformDb: Database | null = null;

/** Lazily open the platform DB. Avoids opening SQLite at module load, which
 *  would otherwise lock the file across Next.js build worker processes. */
function platformDb(): Database {
  if (_platformDb) return _platformDb;
  const db = new Database(join(DATA_DIR, "luminaweb-platform.sqlite"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  db.exec(`
    create table if not exists cli_tokens (
      id text primary key,
      user_id text not null,
      name text not null,
      token_hash text not null unique,
      created_at text not null,
      last_used_at text
    );
    create table if not exists deploys (
      id text primary key,
      name text not null,
      owner_id text,
      public integer not null default 1,
      claimed_at text,
      created_at text not null,
      updated_at text not null
    );
  `);
  _platformDb = db;
  return db;
}

export function createToken(userId: string, name: string) {
  const token = `lw_${crypto.randomUUID().replaceAll("-", "")}_${crypto.randomUUID().replaceAll("-", "")}`;
  const now = new Date().toISOString();
  platformDb()
    .query("insert into cli_tokens (id, user_id, name, token_hash, created_at) values (?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), userId, name || "CLI token", hashToken(token), now);
  return token;
}

export function verifyBearer(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  if (!token) return null;
  const row = platformDb()
    .query<{ user_id: string }, [string]>("select user_id from cli_tokens where token_hash = ?")
    .get(hashToken(token));
  if (!row) return null;
  platformDb().query("update cli_tokens set last_used_at = ? where token_hash = ?").run(new Date().toISOString(), hashToken(token));
  return { userId: row.user_id };
}

export function saveDeploy(input: {
  name: string;
  files: DistFile[];
  ownerId: string | null;
  isPublic: boolean;
  id?: string;
}) {
  const id =
    input.id && /^dep_[a-z0-9_]+$/.test(input.id)
      ? input.id
      : `dep_${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
  const root = deployRoot(id);
  mkdirSync(root, { recursive: true });
  for (const file of input.files) {
    const safe = safeDistPath(file.path);
    const target = join(root, safe);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(file.contentBase64, "base64"));
  }
  const now = new Date().toISOString();
  platformDb()
    .query("insert into deploys (id, name, owner_id, public, claimed_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)")
    .run(id, input.name, input.ownerId, input.isPublic ? 1 : 0, input.ownerId ? now : null, now, now);
  return id;
}

export function claimDeploy(id: string, ownerId: string) {
  const now = new Date().toISOString();
  const result = platformDb()
    .query("update deploys set owner_id = ?, claimed_at = coalesce(claimed_at, ?), updated_at = ? where id = ?")
    .run(ownerId, now, now, id);
  return result.changes > 0;
}

export function listDeploys(ownerId: string) {
  return platformDb()
    .query<DeployRecord, [string]>("select id, name, owner_id as ownerId, claimed_at as claimedAt, created_at as createdAt, updated_at as updatedAt, public from deploys where owner_id = ? order by created_at desc")
    .all(ownerId);
}

export function getDeploy(id: string) {
  return platformDb()
    .query<DeployRecord, [string]>("select id, name, owner_id as ownerId, claimed_at as claimedAt, created_at as createdAt, updated_at as updatedAt, public from deploys where id = ?")
    .get(id);
}

export function removeDeploy(id: string) {
  const root = deployRoot(id);
  if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  platformDb().query("delete from deploys where id = ?").run(id);
  handlerCache.delete(id);
}

const handlerCache = new Map<string, { handler: (req: Request) => Promise<Response> | Response; logs: LogEntry[] }>();

export async function serveDeploy(req: Request, id: string, rest: string) {
  const deploy = getDeploy(id);
  if (!deploy) return new Response("deploy not found", { status: 404 });
  const root = deployRoot(id);
  const url = new URL(req.url);
  const prefix = `/d/${id}`;
  const localPath = rest || "/";

  if (localPath === "/__zap__/client.js" || localPath === "/client/bundle.js") {
    return serveFile(join(root, "client", "bundle.js"), "application/javascript; charset=utf-8");
  }
  if (localPath === "/__zap__/client.css" || localPath === "/client/bundle.css") {
    return serveFile(join(root, "client", "bundle.css"), "text/css; charset=utf-8");
  }
  if (localPath === "/" || localPath === "") {
    const html = readFileSync(join(root, "client", "index.html"), "utf-8")
      .replaceAll('src="/__zap__/', `src="${prefix}/__zap__/`)
      .replaceAll('href="/__zap__/', `href="${prefix}/__zap__/`)
      .replace(
        "</head>",
        `<script>window.__LUMINAWEB_BASE__=${JSON.stringify(prefix)};</script></head>`,
      );
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  const runtimeReq = new Request(new URL(localPath, url.origin), req);
  const entry = await getDeployHandler(id, root, deploy.name);
  return entry.handler(runtimeReq);
}

/** Load a user deploy bundle at runtime. Next/webpack must not rewrite this import. */
async function importDeployModule(serverPath: string): Promise<{ default: CapsuleDef }> {
  const href = pathToFileURL(serverPath).href;
  // webpackIgnore keeps the native dynamic import in the production server bundle
  return import(/* webpackIgnore: true */ href);
}

async function getDeployHandler(id: string, root: string, name: string) {
  const cached = handlerCache.get(id);
  if (cached) return cached;
  const serverPath = join(root, "server.mjs");
  if (!existsSync(serverPath)) {
    throw new Error(`deploy server bundle missing: ${serverPath}`);
  }
  const mod = await importDeployModule(serverPath);
  const def: CapsuleDef = mod.default;
  const logs: LogEntry[] = [];
  const database = new MemoryDatabase(def.schema ?? {});
  const handler = createHandler(def, {
    name,
    version: "0.1.0",
    dev: false,
    env: readEnv(root),
    database,
    fetchLogger: (entry) => {
      logs.push(entry);
      if (logs.length > 200) logs.shift();
    },
  });
  const entry = { handler, logs };
  handlerCache.set(id, entry);
  return entry;
}

function readEnv(root: string): Record<string, string | undefined> {
  const path = join(root, ".env.luminaweb.server");
  if (!existsSync(path)) return {};
  const out: Record<string, string | undefined> = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, "");
  }
  return out;
}

function serveFile(path: string, contentType: string) {
  if (!existsSync(path)) return new Response("not found", { status: 404 });
  return new Response(readFileSync(path), { headers: { "content-type": contentType } });
}

function deployRoot(id: string) {
  return join(DEPLOYS_DIR, basename(id));
}

function safeDistPath(path: string) {
  const clean = path.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!clean || clean.includes("..") || clean.startsWith("/")) throw new Error(`unsafe dist path: ${path}`);
  return clean;
}

function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}
