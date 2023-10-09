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

test("Asar.headerSize", () => {
  expect(asar.headerSize).toBeNumber();
});

test("Asar.rawHeader", () => {
  expect(asar.rawHeader).toBeString();

  writeFile("test/ignore/asar-header.json", asar.rawHeader);
});

test("Asar.header", () => {
  expect(asar.header).toBeInstanceOf(Header);
});

let packageJsonEntry: Entry;

test("Header.getFromPath", () => {
  packageJsonEntry = asar.header.getFromPath("package.json");

  expect(packageJsonEntry).toBeInstanceOf(Entry);
});

test("Header.listFiles", async () => {
  const files = asar.header.listFiles();

  await writeFile(
    "test/ignore/asar-files.json",
    JSON.stringify(files, null, 2)
  );

  expect(files).toBeArray();
  expect(files).not.toBeEmpty();
  expect(files).toContain("package.json");
  expect(files).toContain("dist");
  expect(files).toContain("node_modules");
});

test("Header.listFiles [chunks]", async () => {
  const files = asar.header.listFiles({
    chunks: true,
  });

  await writeFile(
    "test/ignore/asar-files-chunks.json",
    JSON.stringify(files, null, 2)
  );

  expect(files).toBeArray();
  expect(files).not.toBeEmpty();
});

test("Header.listFiles [recursive]", async () => {
  const files = asar.header.listFiles({
    recursive: true,
  });

  await writeFile(
    "test/ignore/asar-files-recursive.json",
    JSON.stringify(files, null, 2)
  );

  expect(files).toBeArray();
  expect(files).not.toBeEmpty();
});

test("Header.listFiles [recursive, chunks]", async () => {
  const files = asar.header.listFiles({
    recursive: true,
    chunks: true,
  });

  await writeFile(
    "test/ignore/asar-files-recursive-chunks.json",
    JSON.stringify(files, null, 2)
  );

  expect(files).toBeArray();
  expect(files).not.toBeEmpty();
});

test("Entry.isFile", () => {
  expect(Entry.isFile(packageJsonEntry)).toBeTrue();
});

test("Entry.isDirectory", () => {
  expect(Entry.isDirectory(packageJsonEntry)).toBeFalse();
});

test("Asar.readFile [package.json]", async () => {
  const packageJson = asar.readFile("package.json").toString();

  expect(packageJson).toBeString();

  await writeFile("test/ignore/asar-package.json", packageJson!);

  expect(packageJson[0]).toBe("{");
});

test("Asar.readFile [dist/main.js]", async () => {
  const packageMain = asar.readFile("dist/main.js").toString();

  expect(packageMain).toBeString();

  await writeFile("test/ignore/asar-main.js", packageMain!);
});

test("Asar.writeFile [foo.txt]", () => {
  const data = "Hello, world!";

  asar.writeFile("foo.txt", data);
});

// Save modified ASAR
test("Save ASAR", async () => {
  await writeFile("test/ignore/app.asar", asar.data);
});
