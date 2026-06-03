/**
 * Shared context type passed to every command.
 */

import type * as fs from "node:fs";
import type * as path from "node:path";
import * as outMod from "./utils.js";

export type Ctx = {
  args: string[];
  version: string;
  banner: string;
  flag: (name: string) => string | undefined;
  boolFlag: (name: string) => boolean;
  out: typeof outMod.out;
};
