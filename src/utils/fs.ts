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
    const isDir = entry.isDirectory();

    if (isDir) {
      if (includeDirectories) {
        yield [entry.name, isDir];
      }

      for await (const path of walk(joinPaths(dir, entry.name))) {
        path[0] = joinPaths(entry.name, path[0]);
        yield path;
      }
    } else {
      yield [entry.name, isDir];
    }
  }
}
