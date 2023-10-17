import { Asar } from "../..";

import { writeFile } from "fs/promises";

export default async function pack(...args: string[]) {
  const [input, archive] = args;

  const asar = await Asar.fromDirectory(input);

  // Save Asar
  await asar.saveData(archive);
}
