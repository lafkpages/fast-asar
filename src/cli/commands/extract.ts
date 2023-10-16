import { Asar, BaseEntry } from "../..";

import { readFile, writeFile, mkdir } from "fs/promises";

import { join as joinPaths, dirname } from "path";

export default async function extract(...args: string[]) {
  const [archive, output] = args;

  const asarBytes = await readFile(archive);

  const asar = new Asar(asarBytes);

  for (const [, filePathChunks, fileEntry] of asar.walkFiles(true)) {
    if (BaseEntry.isDirectory(fileEntry)) {
      const fileDirPath = joinPaths(output, ...filePathChunks);

      await mkdir(fileDirPath, {
        recursive: true,
      });
    } else {
      const filePath = joinPaths(output, ...filePathChunks);

      const fileData = asar.readFile(fileEntry);

      await writeFile(filePath, fileData);
    }
  }
}
