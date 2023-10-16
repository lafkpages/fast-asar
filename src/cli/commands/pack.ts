import { Asar } from "../..";

import { readFile, readdir, writeFile } from "fs/promises";

import { join as joinPaths } from "path";

async function* walk(
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

export default async function pack(...args: string[]) {
  const [input, archive] = args;

  const asar = new Asar();

  for await (const [filePath] of walk(input)) {
    const fileData = await readFile(joinPaths(input, "..", filePath));

    asar.writeFile(filePath, fileData, true);
  }

  // Save Asar
  const asarData = asar.getData();

  await writeFile(archive, asarData.bytes);
}
