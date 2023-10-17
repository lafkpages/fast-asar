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

## Compatibility

This library can be run with [Node.js](https://nodejs.org) and [Bun](https://bun.sh).

Browser support is planned.

## Benchmarks

The following benchmarks were run with [hyperfine](https://github.com/sharkdp/hyperfine) on a 2016 MacBook Pro with a 2.9 GHz Quad-Core Intel Core i7 processor and 16 GB of RAM.

### Extract files

This benchmark extracts all files in the Replit Desktop app's `app.asar` file.

| Command                                                                  |     Mean [ms] | Min [ms] | Max [ms] |    Relative |
| :----------------------------------------------------------------------- | ------------: | -------: | -------: | ----------: |
| `./node_modules/.bin/asar extract test/ignore/app.asar test/ignore/app1` |  670.0 ± 52.6 |    614.6 |    739.4 | 1.54 ± 0.41 |
| `bun ./src/cli/index.ts extract test/ignore/app.asar test/ignore/app2`   | 435.1 ± 110.9 |    373.7 |    632.3 |        1.00 |

Summary: `fast-asar` is 1.54 ± 0.41 times faster than `@electron/asar`.

To run this benchmark yourself, run `bun run benchmark:extract`.

### List files

This benchmark lists all files in the Replit Desktop app's `app.asar` file.

| Command                                              |    Mean [ms] | Min [ms] | Max [ms] |    Relative |
| :--------------------------------------------------- | -----------: | -------: | -------: | ----------: |
| `./node_modules/.bin/asar list test/ignore/app.asar` | 136.0 ± 31.3 |    117.5 |    191.5 | 1.28 ± 0.30 |
| `bun ./src/cli/index.ts list test/ignore/app.asar`   |  106.0 ± 5.9 |    101.3 |    116.2 |        1.00 |

Summary: `fast-asar` is 1.28 ± 0.30 times faster than `@electron/asar`.

To run this benchmark yourself, run `bun run benchmark:list`.

## Contributing

### Running tests

For the tests, you must have the Replit Desktop app's `app.asar` file in the `test/ignore` directory.
You can get this file by installing the Replit Desktop app and copying the `app.asar` file from the installation directory.

Then, to run all tests:

```sh
bun pretest
bun test
```
