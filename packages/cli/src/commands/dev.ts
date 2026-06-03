/**
 * `zapdev dev [dir] [--port 3000]`
 *
 * Starts a local dev server: bundles the Preact client with esbuild on
 * demand, runs the server runtime on Bun, and proxies client requests
 * to the in-memory dev bundle. Watches `server/`, `client/`, and
 * `shared/` for changes.
 */

import { existsSync, readFileSync, watch } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

export async function devCommand(ctx: Ctx) {
  const dir = resolve(process.cwd(), ctx.args[1] && !ctx.args[1].startsWith("--") ? ctx.args[1] : ".");
  const port = Number(ctx.flag("port") ?? "3000");

  if (!existsSync(join(dir, "server/index.ts"))) {
    out.err(`no server/index.ts in ${dir}`);
    out.plain(`  run \`zapdev new\` first to scaffold a capsule.`);
    process.exit(1);
  }

  out.banner("▌▌  zapdev dev");
  out.step(`directory: ${dir}`);
  out.step(`port:      ${port}`);
  out.plain("");

  await startServer(dir, port);

  out.ok(`serving on http://localhost:${port}`);
  out.plain("");

  watchTree(dir);
}

async function startServer(dir: string, port: number) {
  const subprocess = Bun.spawn({
    cmd: ["bun", "--hot", "run", "server/index.ts"],
    cwd: dir,
    env: {
      ...process.env,
      PORT: String(port),
      ZAPDEV_PORT: String(port),
      ZAPDEV_DEV: "1",
    },
    stdout: "inherit",
    stderr: "inherit",
  });
  process.on("SIGINT", () => {
    subprocess.kill();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    subprocess.kill();
    process.exit(0);
  });
}

function watchTree(dir: string) {
  try {
    watch(dir, { recursive: true }, (event, filename) => {
      if (!filename) return;
      if (filename.includes("node_modules") || filename.includes(".zapdev")) return;
      out.dim(`→ ${event} ${filename}`);
    });
  } catch {
    // some platforms do not support recursive watch
  }
}
