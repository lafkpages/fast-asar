import { writeFile } from "fs/promises";

import { Asar } from "../..";

export default async function inspect(...args: string[]) {
  const [archive, rawHeaderDest] = args;

  const asar = await Asar.fromFile(archive, {
    storeInitialParseData: true,
  });

  if (asar.initialParseData?.headerSize !== undefined) {
    console.log("header size:", asar.initialParseData?.headerSize);
  }

  if (asar.initialParseData?.header !== undefined) {
    const prettyHeader = JSON.stringify(asar.initialParseData.header, null, 2);

    if (rawHeaderDest) {
      await writeFile(rawHeaderDest, prettyHeader);
      console.log("raw header written to", rawHeaderDest);
    } else {
      console.log("raw header:", prettyHeader);
    }
  }
}
