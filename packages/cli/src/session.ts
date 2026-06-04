import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const CONFIG_PATH = join(homedir(), ".luminaweb", "config.json");

export function getConfiguredToken() {
  if (process.env.LUMINAWEB_TOKEN) return process.env.LUMINAWEB_TOKEN;
  try {
    if (!existsSync(CONFIG_PATH)) return undefined;
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    return typeof parsed.token === "string" ? parsed.token : undefined;
  } catch {
    return undefined;
  }
}

export function saveConfiguredToken(token: string) {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify({ token, savedAt: new Date().toISOString() }, null, 2) + "\n", { mode: 0o600 });
}

export function configPath() {
  return CONFIG_PATH;
}
