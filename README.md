# fast-asar

A faster implementation of Electron's ASAR archive format.

This is both a library and a CLI tool.

## Installation

You can install `fast-asar` from NPM:

```sh
npm install fast-asar
```

## Usage

### CLI

You can use the CLI tool to extract and create ASAR archives.

```sh
npx fast-asar help
```

### Library

The library exports an `Asar` class, which can be used to read and write ASAR archives.

For example, to extract an ASAR archive to a directory:

```ts
import { Asar } from "fast-asar";
import { readFile } from "fs/promises";

const asarBytes = await readFile("./app.asar");

const asar = new Asar(asarBytes);

await asar.extract("./app-extracted");
```

For more information, see the [API documentation](https://lafkpages.github.io/fast-asar/).

## Contributing

### Running tests

For the tests, you must have the Replit Desktop app's `app.asar` file in the `test/ignore` directory.
You can get this file by installing the Replit Desktop app and copying the `app.asar` file from the installation directory.

Then, to run all tests:

```sh
bun pretest
bun test
```
