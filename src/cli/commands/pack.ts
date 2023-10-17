import { Asar } from "../..";

import { walk } from "../../utils/fs";

import { readFile, writeFile } from "fs/promises";
import { join as joinPaths } from "path";

export default async function pack(...args: string[]) {
  const [input, archive] = args;

  const asar = await Asar.fromDirectory(input);

  // Save Asar
  const asarData = asar.getData();

  await writeFile(archive, asarData.bytes);
}
