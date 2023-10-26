import { Asar } from "../..";

export default async function extract(...args: string[]) {
  const [archive, output] = args;

  const asar = await Asar.fromFile(archive);

  await asar.extract(output);
}
