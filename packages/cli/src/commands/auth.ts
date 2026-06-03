/**
 * `luminaweb auth as <name>` / `luminaweb auth reset`
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

const CONFIG_PATH = join(homedir(), ".luminaweb", "config.json");

export async function authCommand(ctx: Ctx) {
  const sub = ctx.args[1];
  if (sub === "as") {
    const name = ctx.args[2];
    if (!name) {
      out.err("usage: luminaweb auth as <name>");
      process.exit(2);
    }
    const cfg = readConfig();
    cfg.guest = name;
    writeConfig(cfg);
    out.ok(`guest identity set: ${name}`);
    out.plain(`  → http://localhost:3000/?luminaweb_guest=${name}`);
  } else if (sub === "reset") {
    const cfg = readConfig();
    delete cfg.guest;
    writeConfig(cfg);
    out.ok("guest identity cleared");
  } else {
    out.err("usage: luminaweb auth as <name> | luminaweb auth reset");
    process.exit(2);
  }
}

function readConfig(): Record<string, unknown> {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeConfig(cfg: Record<string, unknown>) {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}
