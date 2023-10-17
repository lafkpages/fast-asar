/// <reference types="bun-types" />

import { test, expect } from "bun:test";

import { Asar, BaseEntry } from "../src";

import { readFile, readdir, writeFile } from "fs/promises";
import { normalize as normalizePath } from "path";

import type { FileEntryData } from "../src/types/entries";

const asarData = await readFile("test/ignore/app.asar");
let asar: Asar;

// This test assumes that the ASAR file given belongs
// to the Replit Desktop app, and has a package.json file.

test("new Asar", () => {
  asar = new Asar(asarData, {
    storeInitialParseData: true,
  });

  expect(asar).toBeDefined();
  expect(asar).toBeInstanceOf(Asar);
});

test("new Asar [empty]", () => {
  const emptyAsar = new Asar();

  expect(emptyAsar).toBeDefined();
  expect(emptyAsar).toBeInstanceOf(Asar);

  const files = emptyAsar.listFiles();

  expect(files).toBeArray();
  expect(files).toBeEmpty();
});

test("Asar.initialParseData.headerSize", async () => {
  expect(asar.initialParseData?.headerSize).toBeNumber();
  // Now we can "!" assert it

  await writeFile(
    "test/ignore/asar-header-size.txt",
    asar.initialParseData!.headerSize.toString()
  );
});

test("Asar.initialParseData.rawHeader ", async () => {
  expect(asar.initialParseData?.rawHeader).toBeString();
  // Now we can "!" assert it

  await writeFile(
    "test/ignore/asar-header-raw.json",
    asar.initialParseData!.rawHeader
  );
});

test("Asar.initialParseData.header    ", () => {
  const header = asar.initialParseData?.header;

  expect(header).toBeDefined();
  // Now we can "!" assert it

  expect(BaseEntry.isDirectory(asar.initialParseData!.header)).toBeTrue();
});

test("Asar.extract", async () => {
  const extractOutputPath = "test/ignore/app.asar.extracted";

  await asar.extract(extractOutputPath);

  const extractedFiles = await readdir(extractOutputPath);
  const asarFiles = asar.listFiles();

  expect(extractedFiles).toBeArray();
  expect(extractedFiles).not.toBeEmpty();
  expect(extractedFiles).toContain("package.json");

  expect(asarFiles).toBeArray();
  expect(asarFiles).not.toBeEmpty();
  expect(asarFiles).toContain("package.json");

  // Expect the same files to be extracted as are in the ASAR
  expect(extractedFiles.length).toBe(asarFiles.length);

  for (const file of extractedFiles) {
    expect(asarFiles).toContain(file);
  }
});

let packageJsonEntry: BaseEntry;

test("Header.getFromPath", () => {
  packageJsonEntry = asar.getFromPath("package.json");

  expect(packageJsonEntry).toBeInstanceOf(BaseEntry);
});

test("Header.listFiles  ", async () => {
  const files = asar.listFiles();

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

test("Header.walkFiles  ", async () => {
  const files = [...asar.walkFiles()];
  const filesWithoutEntries = files.map((file) => [file[0], file[1]]);

  await writeFile(
    "test/ignore/asar-walk-files.json",
    JSON.stringify(filesWithoutEntries, null, 2)
  );

  expect(files).toBeArray();
  expect(files).not.toBeEmpty();
  // expect(files).toContain("package.json");
  // expect(files).toContain("dist");
  // expect(files).toContain("node_modules");

  expect(filesWithoutEntries).toBeArray();
  expect(filesWithoutEntries).not.toBeEmpty();
});

test("Entry.isFile \t\t[entry]", () => {
  expect(BaseEntry.isFile(packageJsonEntry)).toBeTrue();
});

test("Entry.isDirectory \t[entry]", () => {
  expect(BaseEntry.isDirectory(packageJsonEntry)).toBeFalse();
});

test("Entry.isFile \t\t[data] ", () => {
  expect(BaseEntry.isFile(packageJsonEntry)).toBeTrue();
});

test("Entry.isDirectory \t[data] ", () => {
  expect(BaseEntry.isDirectory(packageJsonEntry)).toBeFalse();
});

test("Asar.readFile [package.json] ", async () => {
  const packageJson = asar.readFile("package.json").toString();

  expect(packageJson).toBeString();

  expect(packageJson).not.toBeEmpty();

  await writeFile("test/ignore/asar-package.json", packageJson);

  expect(packageJson[0]).toBe("{");

  const packageJsonData = JSON.parse(packageJson);

  expect(packageJsonData).toBeTruthy();
  expect(packageJsonData).not.toBeBoolean();
  expect(packageJsonData).not.toBeNumber();
  expect(packageJsonData).not.toBeString();
  expect(packageJsonData).not.toBeArray();
  expect(packageJsonData).not.toBeFunction();
  expect(packageJsonData).not.toBeSymbol();
  expect(packageJsonData.name).toBeString();
  expect(packageJsonData.version).toBeString();
  expect(packageJsonData.main).toBeString();

  const packageJsonNormalizedEntrypoint = normalizePath(packageJsonData.main);
  expect(packageJsonNormalizedEntrypoint).toBeString();
  expect(packageJsonNormalizedEntrypoint).toBe("dist/main.js");
});

test("Asar.readFile [dist/main.js] ", async () => {
  const packageMain = asar.readFile("dist/main.js").toString();

  expect(packageMain).toBeString();

  await writeFile("test/ignore/asar-main.js", packageMain);

  expect(packageMain).toInclude("replit.com");
});

test("Asar.writeFile [foo.txt]", () => {
  const data = "Hello, world!";

  asar.writeFile("foo.txt", data);
});

test("Asar.writeFile [foo/bar.txt]", () => {
  const data = "Hello, world! (again)";

  asar.writeFile("foo/bar.txt", data, true);
});

// Save modified ASAR
test("Asar.getData", async () => {
  const {
    bytes: asarData,
    rawHeader,
    rawHeaderSize,
    headerString,
    header,
  } = asar.getData({
    returnRawHeader: true,
    returnRawHeaderSize: true,
    returnHeaderString: true,
    returnHeader: true,
  });

  await writeFile("test/ignore/app-getData.asar", asarData);
  await writeFile("test/ignore/app-getData-header.json", rawHeader!);
  await writeFile(
    "test/ignore/app-getData-headerSize.txt",
    rawHeaderSize!.toString()
  );
  // TODO: getData should have an overload so that
  // we don't need to "!" assert rawHeader

  expect(asarData).toBeInstanceOf(Uint8Array);
  expect(asarData).not.toBeEmpty();

  expect(headerString).toBeString();
  expect(headerString).not.toBeEmpty();
  expect(headerString![0]).toBe("{");

  expect(rawHeader).toBeInstanceOf(Uint8Array);
  expect(rawHeader).not.toBeEmpty();

  expect(rawHeaderSize).toBeNumber();
  expect(rawHeaderSize).toBe(rawHeader!.length);

  expect(header).toBeDefined();
  expect(header).not.toBeEmpty();
  expect(BaseEntry.isDirectory(header!)).toBeTrue();
  expect(header!.files).toBeDefined();
  expect(header!.files).not.toBeEmpty();
  expect(header!.files["package.json"]).toBeDefined();
  expect(BaseEntry.isFile(header!.files["package.json"]!)).toBeTrue();
  expect((header!.files["package.json"] as FileEntryData).size).toBeNumber();
  expect((header!.files["package.json"] as FileEntryData).offset).toBeString();
  expect((header!.files["package.json"] as FileEntryData).data).toBeUndefined();
});
