import { Asar } from "../..";

import { readFile } from "fs/promises";

export default async function extract(...args: string[]) {
  const [archive, output] = args;

  const asarBytes = await readFile(archive);

  const asar = new Asar(asarBytes);

  await asar.extract(output);
}
