/**
 * Zapdev Edge runtime.
 *
 * Serves a built capsule from `./dist/`. The bundle structure is:
 *
 *   dist/server.mjs            (the capsule's `capsule()` default export)
 *   dist/client/index.html
 *   dist/client/bundle.js
 *   dist/client/bundle.css     (optional)
 *   dist/manifest.json
 *
 * The edge handles:
 *  - GET  /__zap__/manifest
 *  - POST /__zap__/query/<name>
 *  - POST /__zap__/mutation/<name>
 *  - GET  /__zap__/auth/me
 *  - POST /__zap__/auth/sign-out
 *  - GET  /__zap__/client.js           (serves the bundled client)
 *  - GET  /__zap__/client.css
 *  - GET|POST|PUT|DELETE|PATCH /<path>  (capsule endpoints, then static SPA)
 *
 * Env (optional):
 *   ZAPDEV_DATA_DIR    where to store SQLite files (default: ./data)
 *   ZAPDEV_NAME        capsule name (default: "capsule")
 *   ZAPDEV_VERSION     capsule version (default: "0.1.0")
 *   ZAPDEV_TRUST_PROXY_HEADERS  trust X-Forwarded-For (default: 1)
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHandler, type LogEntry } from "luminaweb-runtime/server";
import { createSqliteDatabase } from "luminaweb-runtime/server/sqlite";
import { MemoryDatabase } from "luminaweb-runtime/server/memory";

const PORT = Number(process.env.PORT ?? process.env.ZAPDEV_PORT ?? 3000);
const NAME = process.env.ZAPDEV_NAME ?? "capsule";
const VERSION = process.env.ZAPDEV_VERSION ?? "0.1.0";
const DATA_DIR = process.env.ZAPDEV_DATA_DIR ?? resolve(process.cwd(), "data");
const DIST_DIR = resolve(process.cwd(), "dist");
const CAPSULE_PATH = join(DIST_DIR, "server.mjs");
const CLIENT_DIR = join(DIST_DIR, "client");

if (!existsSync(CAPSULE_PATH)) {
  console.error(`[zapdev-edge] missing build at ${CAPSULE_PATH}`);
  console.error(`[zapdev-edge] run \`zapdev build --target edge --out dist\` first.`);
  process.exit(1);
}

const mod = await import(CAPSULE_PATH);
const def = mod.default;
if (!def) {
  console.error(`[zapdev-edge] ${CAPSULE_PATH} did not export a default capsule.`);
  process.exit(1);
}

const database = createSqliteDatabase(join(DATA_DIR, `${NAME}.sqlite`), def.schema ?? {});

const handler = createHandler(def, {
  name: NAME,
  version: VERSION,
  dev: process.env.ZAPDEV_DEV === "1",
  env: readServerEnv(),
  database,
  fetchLogger: (entry: LogEntry) => log(entry),
});

const logBuffer: LogEntry[] = [];
function log(entry: LogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > 200) logBuffer.shift();
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/__zap__/client.js" || url.pathname === "/client/bundle.js") {
      return serveClient("bundle.js");
    }
    if (url.pathname === "/__zap__/client.css" || url.pathname === "/client/bundle.css") {
      return serveClient("bundle.css");
    }
    return handler(req);
  },
});

console.log(`[zapdev-edge] ${NAME}@${VERSION} listening on http://localhost:${server.port}`);

function serveClient(name: string) {
  const path = join(CLIENT_DIR, name);
  if (!existsSync(path)) {
    return new Response("client bundle missing", { status: 404 });
  }
  const contentType = name.endsWith(".css") ? "text/css; charset=utf-8" : "application/javascript; charset=utf-8";
  return new Response(readFileSync(path), { headers: { "content-type": contentType } });
}

function readServerEnv(): Record<string, string | undefined> {
  const path = join(process.cwd(), ".env.zapdev.server");
  if (!existsSync(path)) return {};
  const out: Record<string, string | undefined> = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}
