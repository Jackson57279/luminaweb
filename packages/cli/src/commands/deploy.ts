/**
 * `luminaweb deploy [dir]`
 *
 * Uploads a built bundle to the configured Luminaweb Edge. The default edge
 * is the Luminaweb Cloud; the env var LUMINAWEB_EDGE_URL can override.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Ctx } from "../ctx.js";
import { getConfiguredToken } from "../session.js";
import { out } from "../utils.js";

export async function deployCommand(ctx: Ctx) {
  const dir = resolve(process.cwd(), ctx.args[1] && !ctx.args[1].startsWith("--") ? ctx.args[1] : ".");
  const isPublic = ctx.boolFlag("public");
  const edgeUrl = process.env.LUMINAWEB_EDGE_URL ?? "https://luminaweb.app";
  const token = getConfiguredToken();

  if (!existsSync(join(dir, "dist/manifest.json"))) {
    out.err(`no dist/manifest.json in ${dir}`);
    out.plain(`  run \`luminaweb build\` first.`);
    process.exit(1);
  }

  out.banner("▌▌  luminaweb deploy");
  out.step(`directory: ${dir}`);
  out.step(`edge:      ${edgeUrl}`);
  out.step(`public:    ${isPublic}`);
  out.plain("");

  if (!token) {
    out.err("not authenticated");
    out.plain("  open https://luminaweb.app/account and create a CLI token.");
    out.plain("  then run: luminaweb login --token lw_...");
    process.exit(1);
  }

  const files = collectDist(join(dir, "dist"));
  out.ok("bundled dist/");
  for (const file of files) out.plain(`  → ${file.path} (${Math.ceil(file.contentBase64.length * 0.75)} B)`);
  out.plain("");

  out.step(`deploying to ${edgeUrl}...`);
  const res = await fetch(new URL("/api/deploy", edgeUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: readName(dir), public: isPublic, files }),
  });
  const body = await res.json().catch(() => null) as { id?: string; url?: string; claim?: string; error?: string } | null;
  if (!res.ok || !body?.id || !body.url) {
    out.err(`deploy failed: ${body?.error ?? res.statusText}`);
    process.exit(1);
  }
  out.ok(`deploy ${body.id} is live`);
  out.plain("");
  out.plain(`  url:  ${body.url}`);
  out.plain(`  claim: ${body.claim ?? `luminaweb claim ${body.id}`}`);
  out.plain("");
}

function collectDist(root: string) {
  const files: { path: string; contentBase64: string }[] = [];
  walk(root, "", files);
  return files;
}

function walk(root: string, prefix: string, files: { path: string; contentBase64: string }[]) {
  for (const entry of readdirSync(join(root, prefix))) {
    const rel = prefix ? `${prefix}/${entry}` : entry;
    const abs = join(root, rel);
    const stat = statSync(abs);
    if (stat.isDirectory()) walk(root, rel, files);
    else files.push({ path: rel, contentBase64: Buffer.from(readFileSync(abs)).toString("base64") });
  }
}

function readName(dir: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    return typeof pkg.name === "string" ? pkg.name : "capsule";
  } catch {
    return "capsule";
  }
}
