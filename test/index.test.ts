import { test, expect } from "bun:test";

import { Asar, Header } from "../src";
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

test("isFile", () => {
  expect(asar?.isFile("package.json")).toBeTrue();
  expect(asar?.isFile("./package.json")).toBeTrue();
});

test("isDirectory", () => {
  expect(asar?.isDirectory("package.json")).toBeFalse();
  expect(asar?.isDirectory("./package.json")).toBeFalse();
  expect(asar?.isDirectory("foo/bar/../../package.json")).toBeFalse();
  expect(asar?.isDirectory("package.json/")).toBeFalse();

  expect(asar?.isDirectory("node_modules")).toBeTrue();
});
