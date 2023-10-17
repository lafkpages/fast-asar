import { readdir } from "fs/promises";
import { join as joinPaths } from "path";

export async function* walk(
  dir: string,
  includeDirectories = false
): AsyncGenerator<[string, boolean], void, unknown> {
  const entries = await readdir(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const entryPath = joinPaths(dir, entry.name);

    const isDir = entry.isDirectory();

    if (isDir) {
      if (includeDirectories) {
        yield [entryPath, isDir];
      }

      yield* walk(entryPath);
    } else {
      yield [entryPath, isDir];
    }
  }
}
