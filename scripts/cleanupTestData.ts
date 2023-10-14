import { rm, readdir } from "fs/promises";
import { join as joinPaths } from "path";

// rm -f test/ignore/*.{js,json,txt}
// rm -f test/ignore/app-*.asar

const ignoreDir = "test/ignore";

for (const file of await readdir(ignoreDir)) {
  if (/\.(js|json|txt)$|^app-.+\.asar/.test(file)) {
    await rm(joinPaths(ignoreDir, file));
  }
}
