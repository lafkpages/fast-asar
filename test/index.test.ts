import { test, expect } from "bun:test";

import { Asar } from "../src";
import { readFile } from "fs/promises";

const asarData = await readFile("test/app.asar");

test("Init ASAR", () => {
  const asar = new Asar(asarData);

  expect(asar).toBeInstanceOf(Asar);
  expect(asar.headerSize).toBeNumber();
  expect(asar.rawHeader).toBeString();
  expect(asar.header).toBeDefined();
});
