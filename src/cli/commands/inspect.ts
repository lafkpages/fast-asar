import { writeFile } from "fs/promises";

import { Asar } from "../..";

export default async function inspect(...args: string[]) {
  const [archive] = args;
  const dest = archive + ".json";

  const asar = await Asar.fromFile(archive, {
    storeInitialParseData: true,
    noFileData: true,
  });

  if (asar.initialParseData?.headerSize !== undefined) {
    console.log("header size:", asar.initialParseData?.headerSize);
  }

  if (asar.initialParseData?.header !== undefined) {
    const prettyHeader = JSON.stringify(asar.initialParseData.header, null, 2);

    await writeFile(dest, prettyHeader);
    console.log("raw header written to", dest);
  }
}
