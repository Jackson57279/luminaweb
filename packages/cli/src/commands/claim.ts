/**
 * `luminaweb claim [dir]`
 *
 * Associates the latest deploy of this capsule with the caller's account
 * so server env, outbound `fetch`, and stable URLs are enabled.
 */

import { resolve } from "node:path";
import type { Ctx } from "../ctx.js";
import { getConfiguredToken } from "../session.js";
import { out } from "../utils.js";

export async function claimCommand(ctx: Ctx) {
  const target = ctx.args[1] && !ctx.args[1].startsWith("--") ? ctx.args[1] : ".";
  const dir = resolve(process.cwd(), target);
  const deployId = target.match(/dep_[a-zA-Z0-9]+/)?.[0];
  const edgeUrl = process.env.LUMINAWEB_EDGE_URL ?? "https://luminaweb.app";
  const token = getConfiguredToken();

  out.banner("▌▌  luminaweb claim");
  out.step(`directory: ${dir}`);
  out.plain("");

  if (!token) {
    out.err("not authenticated");
    out.plain("  open https://luminaweb.app/account and create a CLI token.");
    out.plain("  then run: luminaweb login --token lw_...");
    process.exit(1);
  }

  if (!deployId) {
    out.err("missing deploy id");
    out.plain("  usage: luminaweb claim dep_...");
    process.exit(1);
  }

  const res = await fetch(new URL(`/api/deploy/${deployId}/claim`, edgeUrl), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null) as { error?: string } | null;
  if (!res.ok) {
    out.err(`claim failed: ${body?.error ?? res.statusText}`);
    process.exit(1);
  }
  out.ok("deploy claimed");
  out.plain("  → server env sync enabled");
  out.plain("  → outbound fetch enabled");
  out.plain("  → stable subdomain eligible");
  out.plain("");
  out.plain("  next: reserve a subdomain");
  out.plain("    luminaweb domains add my-app.luminaweb.app");
  out.plain("");
}
