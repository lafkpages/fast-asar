import { test, expect } from "bun:test";

import { Asar, Entry, Header } from "../src";
import { readFile, writeFile } from "fs/promises";

const asarData = await readFile("test/ignore/app.asar");
let asar: Asar;

// This test assumes that the ASAR file given belongs
// to an Electron app, and has a package.json file.

test("new Asar", () => {
  asar = new Asar(asarData);

  expect(asar).toBeInstanceOf(Asar);
});

test("Asar.header", () => {
  expect(asar.headerSize).toBeNumber();
  expect(asar.rawHeader).toBeString();

  writeFile("test/ignore/asar-header.json", asar.rawHeader);

  expect(asar.header).toBeInstanceOf(Header);
});

let packageJsonEntry: Entry;

test("Header.getFromPath", () => {
  packageJsonEntry = asar.header.getFromPath("package.json");

  expect(packageJsonEntry).toBeInstanceOf(Entry);
});

test("Entry.isFile", () => {
  expect(Entry.isFile(packageJsonEntry)).toBeTrue();
});

test("Entry.isDirectory", () => {
  expect(Entry.isDirectory(packageJsonEntry)).toBeFalse();
});

test("Asar.readFile", async () => {
  const packageJson = asar.readFile("package.json").toString();

  expect(packageJson).toBeString();

  await writeFile("test/ignore/asar-package.json", packageJson!);

  expect(packageJson[0]).toBe("{");
});
