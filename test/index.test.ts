import { test, expect } from "bun:test";

import { Asar, Entry, Header } from "../src";
import { readFile } from "fs/promises";

const asarData = await readFile("test/app.asar");
let asar: Asar | null = null;

// This test assumes that the ASAR file given belongs
// to an Electron app, and has a package.json file.

test("Init ASAR", () => {
  asar = new Asar(asarData);

  expect(asar).toBeInstanceOf(Asar);
  expect(asar.headerSize).toBeNumber();
  expect(asar.rawHeader).toBeString();
  expect(asar.header).toBeInstanceOf(Header);
});

let packageJsonEntry: Entry | null = null;

test("getFromPath", () => {
  packageJsonEntry = asar?.header.getFromPath("package.json") ?? null;

  expect(packageJsonEntry).toBeInstanceOf(Entry);
});

test("Entry.isFile", () => {
  if (packageJsonEntry == null) {
    return;
  }

  expect(Entry.isFile(packageJsonEntry)).toBeTrue();
});

test("isDirectory", () => {
  if (packageJsonEntry == null) {
    return;
  }

  expect(Entry.isDirectory(packageJsonEntry)).toBeFalse();
});

test("readFile", () => {
  const packageJson = asar?.readFile("package.json")?.toString() ?? null;

  console.debug(packageJson);

  expect(packageJson).toBeString();
  expect(packageJson?.[0]).toBe("{");
});
