/**
 * Idempotently seeds the public shadcn dashboard showcase at /d/dep_showcase.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getDeploy, removeDeploy, saveDeploy, type DistFile } from "../lib/platform";

const SHOWCASE_ID = "dep_showcase";
const SEED_VERSION = 3;
const DIST_CANDIDATES = [
  resolve(process.cwd(), "showcase-dist"),
  resolve(process.cwd(), "../../examples/dashboard/dist"),
  resolve(import.meta.dir, "../../../examples/dashboard/dist"),
];

function collectDist(root: string): DistFile[] {
  const files: DistFile[] = [];
  function walk(prefix: string) {
    for (const entry of readdirSync(join(root, prefix))) {
      const rel = prefix ? `${prefix}/${entry}` : entry;
      const abs = join(root, rel);
      const stat = statSync(abs);
      if (stat.isDirectory()) walk(rel);
      else files.push({ path: rel, contentBase64: Buffer.from(readFileSync(abs)).toString("base64") });
    }
  }
  walk("");
  return files;
}

function findDistDir(): string | null {
  for (const dir of DIST_CANDIDATES) {
    if (existsSync(join(dir, "manifest.json"))) return dir;
  }
  return null;
}

const distDir = findDistDir();
if (!distDir) {
  console.log("[luminaweb] showcase dist not found — skip seed");
  process.exit(0);
}

const dataDir = process.env.LUMINAWEB_DATA_DIR ?? process.env.ZAPDEV_DATA_DIR ?? resolve(process.cwd(), "data");
const deployRoot = join(dataDir, "deploys", SHOWCASE_ID);
const serverBundle = join(deployRoot, "server.mjs");
const versionMarker = join(deployRoot, ".seed-version");
const existing = getDeploy(SHOWCASE_ID);
const bundleOk =
  existsSync(serverBundle) &&
  !readFileSync(serverBundle, "utf-8").includes("bun:sqlite") &&
  existsSync(versionMarker) &&
  readFileSync(versionMarker, "utf-8").trim() === String(SEED_VERSION);
if (existing && bundleOk) {
  console.log(`[luminaweb] showcase already at /d/${SHOWCASE_ID}`);
  process.exit(0);
}
if (existing) {
  console.log(`[luminaweb] reseeding showcase at /d/${SHOWCASE_ID}`);
  removeDeploy(SHOWCASE_ID);
}

const files = collectDist(distDir);
if (!files.some((f) => f.path === "manifest.json") || !files.some((f) => f.path === "server.mjs")) {
  console.error("[luminaweb] showcase dist incomplete");
  process.exit(1);
}

saveDeploy({
  id: SHOWCASE_ID,
  name: "shadcn-dashboard",
  files,
  ownerId: null,
  isPublic: true,
});

writeFileSync(versionMarker, `${SEED_VERSION}\n`);
const written = existsSync(deployRoot) ? readdirSync(deployRoot) : [];
if (!existsSync(serverBundle)) {
  console.error(`[luminaweb] seed failed: missing ${serverBundle} (wrote: ${written.join(", ")})`);
  process.exit(1);
}

console.log(`[luminaweb] showcase live → /d/${SHOWCASE_ID} (${written.join(", ")})`);
