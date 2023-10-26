import { Asar } from "../..";

import { join as joinPaths } from "path";

export default async function list(...args: string[]) {
  const [archive] = args;

  const asar = await Asar.fromFile(archive, {
    noFileData: true,
  });

  for (const [, filePathChunks] of asar.walkFiles(true)) {
    console.log(joinPaths(...filePathChunks));
  }
}
