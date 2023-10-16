import { Asar } from "../..";

import { readFile } from "fs/promises";

import { join as joinPaths } from "path";

export default async function list(...args: string[]) {
  const [archive] = args;

  const asarBytes = await readFile(archive);

  const asar = new Asar(asarBytes);

  for (const [, filePathChunks] of asar.walkFiles(true)) {
    console.log(joinPaths(...filePathChunks));
  }
}
