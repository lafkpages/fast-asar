import { rm, readdir } from "fs/promises";
import { join as joinPaths } from "path";

const ignoreDir = "test/ignore";

for (const file of await readdir(ignoreDir)) {
  if (/\.(js|json|txt)$|^app-.+\.asar/.test(file)) {
    await rm(joinPaths(ignoreDir, file));
  }
}
