/**
 * `luminaweb build [dir] --target edge --out dist`
 *
 * Produces a self-contained bundle that the Edge runtime can serve.
 * Output structure:
 *
 *   dist/
 *     server.mjs        # the bundled server capsule
 *     client/index.html
 *     client/bundle.js
 *     client/bundle.css
 *     manifest.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

export async function buildCommand(ctx: Ctx) {
  const dir = resolve(process.cwd(), ctx.args[1] && !ctx.args[1].startsWith("--") ? ctx.args[1] : ".");
  const target = ctx.flag("target") ?? "edge";
  const outDir = resolve(dir, ctx.flag("out") ?? "dist");

  if (!existsSync(join(dir, "server/index.ts"))) {
    out.err(`no server/index.ts in ${dir}`);
    process.exit(1);
  }
  if (target !== "edge" && target !== "anonymous") {
    out.err(`unsupported target: ${target}`);
    process.exit(2);
  }

  out.banner("▌▌  luminaweb build");
  out.step(`directory: ${dir}`);
  out.step(`target:    ${target}`);
  out.step(`output:    ${outDir}`);
  out.plain("");

  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, "client"), { recursive: true });

  // Bundle the server.
  const serverResult = await Bun.build({
    entrypoints: [join(dir, "server/index.ts")],
    outdir: outDir,
    target: "bun",
    format: "esm",
    minify: true,
    sourcemap: "external",
    naming: "server.mjs",
  });
  if (!serverResult.success) {
    out.err("server build failed:");
    for (const log of serverResult.logs) out.plain("  " + log);
    process.exit(1);
  }

  // Bundle the client.
  const clientResult = await Bun.build({
    entrypoints: [join(dir, "client/index.tsx")],
    outdir: join(outDir, "client"),
    target: "browser",
    format: "esm",
    minify: true,
    sourcemap: "external",
    naming: "bundle.js",
  });
  if (!clientResult.success) {
    out.err("client build failed:");
    for (const log of clientResult.logs) out.plain("  " + log);
    process.exit(1);
  }

  const html = renderHtml();
  writeFileSync(join(outDir, "client/index.html"), html);

  const manifest = {
    name: readName(dir),
    target,
    builtAt: new Date().toISOString(),
    runtime: "luminaweb-runtime",
    version: "0.1.0",
  };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  out.ok("build complete");
  out.plain("");
  out.plain(`  dist/server.mjs`);
  out.plain(`  dist/client/bundle.js`);
  out.plain(`  dist/client/index.html`);
  out.plain(`  dist/manifest.json`);
  out.plain("");
  out.plain("  next: luminaweb deploy");
  out.plain("");
}

function renderHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Luminaweb Capsule</title>
    <link rel="stylesheet" href="/__zap__/client.css" />
    <style>
      :root { color-scheme: dark; }
      html, body { background: #0a0a0a; color: #f5f5f0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; }
      .__luminaweb_loader { position: fixed; inset: 0; display: grid; place-items: center; font-family: ui-monospace, monospace; color: #7a7a75; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; }
    </style>
  </head>
  <body>
    <div id="app">
      <div class="__luminaweb_loader">luminaweb runtime</div>
    </div>
    <script type="module" src="/__zap__/client.js"></script>
  </body>
</html>
`;
}

function readName(dir: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    return pkg.name ?? "capsule";
  } catch {
    return "capsule";
  }
}
