/**
 * `luminaweb run-many [dir] [--count 20] [--base-port 4000]`
 *
 * Boots N local dev instances on consecutive ports. Useful for testing
 * multi-user flows and load.
 */

import { resolve } from "node:path";
import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

export async function runManyCommand(ctx: Ctx) {
  const dir = resolve(process.cwd(), ctx.args[1] && !ctx.args[1].startsWith("--") ? ctx.args[1] : ".");
  const count = Number(ctx.flag("count") ?? "20");
  const basePort = Number(ctx.flag("base-port") ?? "4000");

  out.banner("▌▌  luminaweb run-many");
  out.step(`directory:  ${dir}`);
  out.step(`count:      ${count}`);
  out.step(`base port:  ${basePort}`);
  out.plain("");

  const procs: Bun.Subprocess[] = [];
  for (let i = 0; i < count; i++) {
    const port = basePort + i;
    const proc = Bun.spawn({
      cmd: ["bun", "run", "server/index.ts"],
      cwd: dir,
      env: {
        ...process.env,
        PORT: String(port),
        LUMINAWEB_PORT: String(port),
        LUMINAWEB_INSTANCE: String(i),
        LUMINAWEB_DEV: "1",
      },
      stdout: "inherit",
      stderr: "inherit",
    });
    procs.push(proc);
  }

  out.ok(`${count} instances running on ${basePort}-${basePort + count - 1}`);
  out.plain("");

  process.on("SIGINT", () => {
    for (const p of procs) p.kill();
    process.exit(0);
  });
}
