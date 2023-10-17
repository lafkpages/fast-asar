import { Asar } from "../..";

import { walk } from "../../utils/fs";

import { readFile, writeFile } from "fs/promises";
import { join as joinPaths } from "path";

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
