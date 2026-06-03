/**
 * Server request handler — bridges Bun's HTTP server to a CapsuleDef.
 *
 * Exposes:
 *   - GET  /__zap__/manifest
 *   - POST /__zap__/query/<name>
 *   - POST /__zap__/mutation/<name>
 *   - GET|POST|PUT|DELETE|PATCH /<path>     (endpoints and client routes)
 *
 * Local `dev` uses the in-memory database so reloads are clean. Production
 * hosts plug in the SQLite database via `withDatabase()`.
 */

import {
  type CapsuleDef,
  type Ctx,
  type Database,
  type EndpointDef,
  type EndpointRequest,
  type Logger,
  type ResolvedCapsule,
  type ServerEnv,
} from "./index.js";
import { jsonResponse, textResponse, notFound, unauthorized, badRequest } from "./index.js";
import { resolveAuth } from "./auth.js";
import { createLogger, type LogEntry } from "./log.js";
import { MemoryDatabase } from "./memory.js";

export type CapsuleHandlerOptions = {
  name: string;
  version: string;
  dev: boolean;
  env: ServerEnv;
  database?: Database;
  fetchLogger?: (entry: LogEntry) => void;
};

export type { LogEntry };

export function resolveCapsule(def: CapsuleDef): ResolvedCapsule {
  return {
    schema: def.schema ?? {},
    queries: def.queries ?? {},
    mutations: def.mutations ?? {},
    endpoints: def.endpoints ?? {},
  };
}

export function createHandler(
  def: CapsuleDef,
  options: CapsuleHandlerOptions,
): (req: Request) => Promise<Response> {
  const capsule = resolveCapsule(def);
  const db = options.database ?? new MemoryDatabase(capsule.schema);
  const fetchLogger = options.fetchLogger;

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const requestId = cryptoRandom();
    const log = createLogger({ requestId, onEntry: fetchLogger });
    const ctx: Ctx = {
      auth: await resolveAuth(req, options),
      db,
      env: options.env,
      log,
      url,
      requestId,
    };

    try {
      if (url.pathname === "/__zap__/manifest") {
        return jsonResponse({
          name: options.name,
          version: options.version,
          tables: Object.keys(capsule.schema),
          queries: Object.keys(capsule.queries),
          mutations: Object.keys(capsule.mutations),
          endpoints: Object.values(capsule.endpoints).map((e: EndpointDef) => ({
            method: e.method,
            path: e.path,
          })),
        });
      }

      if (url.pathname.startsWith("/__zap__/query/")) {
        return await runQuery(ctx, capsule, req, url);
      }

      if (url.pathname.startsWith("/__zap__/mutation/")) {
        return await runMutation(ctx, capsule, req, url);
      }

      if (url.pathname === "/__zap__/auth/me") {
        return jsonResponse(ctx.auth);
      }

      if (url.pathname === "/__zap__/auth/sign-out" && req.method === "POST") {
        return signOutResponse(req);
      }

      for (const [name, endpoint] of Object.entries(capsule.endpoints)) {
        if (matchEndpoint(endpoint, req, url)) {
          const er: EndpointRequest = {
            method: req.method,
            path: url.pathname,
            url,
            headers: req.headers,
            query: url.searchParams,
            text: () => req.text(),
            json: <T>() => req.json() as Promise<T>,
            bytes: () => req.arrayBuffer().then((b) => new Uint8Array(b)),
          };
          return await endpoint.handler(ctx, er);
        }
      }

      return await serveClient(options);
    } catch (err) {
      log.error("unhandled error", { error: String(err) });
      return textResponse("internal error", { status: 500 });
    }
  };
}

async function runQuery(ctx: Ctx, capsule: ResolvedCapsule, req: Request, url: URL): Promise<Response> {
  const name = url.pathname.slice("/__zap__/query/".length);
  const def = capsule.queries[name];
  if (!def) return notFound(`unknown query: ${name}`);
  if (req.method !== "POST" && req.method !== "GET") return badRequest();
  const body = await readArgs<unknown[]>(req, ctx.log);
  if (body instanceof Response) return body;
  try {
    const result = await def.handler(ctx, ...(body ?? []));
    return jsonResponse(result ?? null);
  } catch (err) {
    ctx.log.error(`query ${name} failed`, { error: String(err) });
    return textResponse(String(err), { status: 400 });
  }
}

async function runMutation(ctx: Ctx, capsule: ResolvedCapsule, req: Request, url: URL): Promise<Response> {
  const name = url.pathname.slice("/__zap__/mutation/".length);
  const def = capsule.mutations[name];
  if (!def) return notFound(`unknown mutation: ${name}`);
  if (req.method !== "POST") return badRequest();
  const body = await readArgs<unknown[]>(req, ctx.log);
  if (body instanceof Response) return body;
  try {
    const result = await def.handler(ctx, ...(body ?? []));
    return jsonResponse(result ?? null);
  } catch (err) {
    ctx.log.error(`mutation ${name} failed`, { error: String(err) });
    return textResponse(String(err), { status: 400 });
  }
}

async function readArgs<T>(req: Request, log: Logger): Promise<T | Response> {
  if (req.method === "GET") return [] as unknown as T;
  try {
    const text = await req.text();
    if (!text) return [] as unknown as T;
    const parsed = JSON.parse(text);
    return (Array.isArray(parsed) ? parsed : [parsed]) as T;
  } catch (err) {
    log.warn("failed to parse body", { error: String(err) });
    return badRequest("invalid json body");
  }
}

function matchEndpoint(endpoint: EndpointDef, req: Request, url: URL): boolean {
  if (endpoint.method !== req.method) return false;
  return matchPath(endpoint.path, url.pathname);
}

function matchPath(pattern: string, path: string): boolean {
  if (pattern === path) return true;
  if (!pattern.includes(":")) return false;
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((p, i) => p.startsWith(":") || p === pathParts[i]);
}

async function serveClient(options: CapsuleHandlerOptions): Promise<Response> {
  if (options.dev) {
    return textResponse("client dev server not yet implemented for runtime. use zapdev dev.", { status: 404 });
  }
  const file = Bun.file(`./dist/client/index.html`);
  if (!(await file.exists())) return notFound("client bundle missing");
  return new Response(file, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function signOutResponse(req: Request): Response {
  const cookie = `zapdev_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": cookie,
    },
  });
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export { resolveAuth };
