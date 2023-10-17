import { readdir } from "fs/promises";
import { join as joinPaths } from "path";

/**
 * Walks through a directory and recursively yields all files and directories.
 * @param dir The directory to walk through.
 * @param includeDirectories Whether to include directories in the result.
 */
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
