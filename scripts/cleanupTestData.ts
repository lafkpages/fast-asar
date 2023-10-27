/// <reference types="bun-types" />

import { rm, readdir } from "fs/promises";
import { join as joinPaths } from "path";

const ignoreDir = "test/ignore";

for (const file of await readdir(ignoreDir)) {
  if (/^app$|\.(js|json|txt|extracted)$|^app-.+\.asar/.test(file)) {
    await rm(joinPaths(ignoreDir, file), {
      force: true,
      recursive: true,
    });
  }
}
