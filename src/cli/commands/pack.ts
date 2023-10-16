import { Asar, BaseEntry } from "../..";

import { readFile, readdir, writeFile, mkdir } from "fs/promises";

import { join as joinPaths, resolve } from "path";

import type { Dirent } from "fs";

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

  for await (const [filePath, fileIsDirectory] of walk(input, true)) {
    console.log(filePath, fileIsDirectory ? "/" : "");
  }
}
