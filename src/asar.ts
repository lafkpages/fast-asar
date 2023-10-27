import { normalize as normalizePath, join as joinPaths } from "path";
import { createFromBuffer, createEmpty } from "@tybys/chromium-pickle-js";

import { readFile, writeFile, mkdir } from "fs/promises";

import { walk } from "./utils/fs";

import { BaseEntry, FileEntry, DirectoryEntry } from "./entries";

import type { Entry, FileEntryData, DirectoryEntryData } from "./types/entries";

/**
 * Options for initializing an Asar instance
 */
export interface AsarOptions {
  /**
   * Whether to store data from the initial parsing
   * of the Asar archive, such as the header size,
   * the header object, and the raw header.
   *
   * @see AsarInitialParseData
   */
  storeInitialParseData: boolean;

  /**
   * If enabled, file data will not be read from the Asar archive
   * when initializing the Asar instance. This is useful if you
   * only need the directory structure, for example to list files.
   * Skipping file data will make the initialization faster.
   */
  noFileData: boolean;

  noHeaderTypeChecks: boolean;
}

/**
 * Data from the initial parsing of the Asar archive.
 * This is only available if the `storeInitialParseData` option
 * is enabled when initializing the Asar instance.
 *
 * @see AsarOptions.noFileData
 */
export interface AsarInitialParseData {
  headerSize: number;
  header: DirectoryEntryData;
  rawHeader: string;
}

/**
 * Options for getting the Asar archive data.
 * All options are treated as `false` by default.
 */
export interface AsarGetDataOptions {
  /**
   * By default, the files are sorted alphabetically in
   * the Asar archive header. If this option is enabled,
   * the files will not be sorted, which could speed up
   * getting the Asar archive data.
   */
  noSort: boolean;

  /**
   * When getting the Asar archive data, the file integrity
   * is recalculated by default, even if it is already present
   * in a `FileEntry`. If this option is enabled, the file
   * integrity will not be recalculated if it is already present.
   */
  noRecalculateIntegrity: boolean;

  returnRawHeader: boolean;
  returnRawHeaderSize: boolean;
  returnHeaderString: boolean;
  returnHeader: boolean;
}

export class Asar extends DirectoryEntry {
  initialParseData?: AsarInitialParseData;

  constructor(asarBytes?: Uint8Array, opts: Partial<AsarOptions> = {}) {
    if (asarBytes) {
      // Read header size
      const headerSize = createFromBuffer(asarBytes.subarray(0, 16))
        .createIterator()
        .readUInt32();

      // Read header
      // We start at 16 because 0-8 are the Pickle object containing
      // the header size, and 9-15 are the header size itself
      const rawHeader = asarBytes.subarray(16, headerSize + 16).toString();
      const header = JSON.parse(rawHeader) as unknown;

      if (opts.noHeaderTypeChecks) {
        super(header as DirectoryEntryData);
      } else {
        // Ensure header is an object
        if (typeof header != "object" || header == null) {
          throw new Error("[new Asar] Invalid header (not an object)");
        }

        // Ensure header conforms to directory structure
        if (!BaseEntry.isDirectory(header)) {
          throw new Error("[new Asar] Invalid header (not a directory)");
        }

        super(header);
      }

      if (opts.storeInitialParseData) {
        this.initialParseData = {
          headerSize,
          header: header as DirectoryEntryData,
          rawHeader,
        };
      }

      if (!opts.noFileData) {
        // Read all files
        for (const [, filePath, fileEntry] of this.walkFiles(false)) {
          // We can assume that fileEntry is a FileEntry,
          // because we specified walkFiles(false)
          const offset = (fileEntry as FileEntry).getOffsetFromAsarData(
            headerSize
          );
          const fileData = Asar.readFileFromBytes(
            asarBytes,
            offset,
            (fileEntry as FileEntry).size
          );

          // Save the file data to its entry in this.files
          let currentDir = this.files;
          for (const _pathChunkIndex in filePath) {
            const pathChunkIndex = parseInt(_pathChunkIndex);
            const pathChunk = filePath[pathChunkIndex];

            if (!(pathChunk in currentDir)) {
              throw new Error(
                "[new Asar] File entry not found in directory structure"
              );
            }

            if (pathChunkIndex == filePath.length - 1) {
              // This is the last chunk, so we can assume it's a file
              (currentDir[pathChunk] as FileEntryData).data = fileData;
            }

            currentDir = (currentDir[pathChunk] as DirectoryEntryData).files;
          }
        }
      }
    } else {
      super({ files: {} });
    }
  }

  /**
   * Creates a new Asar instance from a directory
   * @param inputDir The directory to read from
   * @param opts Options for initialising the Asar instance
   * @returns The Asar instance
   */
  static async fromDirectory(
    inputDir: string,
    opts?: ConstructorParameters<typeof Asar>[1]
  ) {
    const asar = new Asar(undefined, opts);

    for await (const [filePath] of walk(inputDir)) {
      const fileData = await readFile(joinPaths(inputDir, filePath));

      asar.writeFile(filePath, fileData, true);
    }

    return asar;
  }

  /**
   * Creates a new Asar instance from an Asar archive file
   * @param asarPath The path to the Asar archive file
   * @param opts Options for initialising the Asar instance
   * @returns The Asar instance
   */
  static async fromFile(
    asarPath: string,
    opts?: ConstructorParameters<typeof Asar>[1]
  ) {
    return new Asar(await readFile(asarPath), opts);
  }

  /**
   * Reads a file from the Asar archive
   * @param path The path to the file inside the Asar archive
   * @returns The file data
   */
  readFile(
    path: Entry | Parameters<DirectoryEntry["getFromPath"]>[0]
  ): Uint8Array {
    const entry = BaseEntry.isEntry(path) ? path : this.getFromPath(path);

    if (BaseEntry.isFile(entry)) {
      if (entry.data == undefined) {
        throw new Error("[Asar.readFile] File data not found");
      }

      return entry.data;
    }

    throw new Error("[Asar.readFile] Entry is not a file");
  }

  private static readFileFromBytes(
    bytes: Uint8Array,
    offset: number,
    size: number
  ) {
    return bytes.subarray(offset, offset + size);
  }

  /**
   * Writes to a file inside the Asar archive
   * @param path The path to the file inside the Asar archive
   * @param data The data to write to the file
   * @param createDirs Whether to create directories in between if they don't exist
   */
  writeFile(
    path: string | string[],
    data: string | Uint8Array,
    createDirs = false
  ) {
    if (typeof path == "string") {
      path = normalizePath(path).split("/");
    }

    if (typeof data == "string") {
      data = Buffer.from(data, "utf-8");
    }

    // Save the file data to its entry in this.files
    let currentDir = this.files;
    for (const _pathChunkIndex in path) {
      const pathChunkIndex = parseInt(_pathChunkIndex);
      const pathChunk = path[pathChunkIndex];
      const isLastChunk = pathChunkIndex == path.length - 1;

      if (!(pathChunk in currentDir)) {
        if (isLastChunk) {
          currentDir[pathChunk]! = {
            data,
            size: data.length,
            offset: "",
          };
          return;
        } else if (createDirs) {
          currentDir[pathChunk] = {
            files: {},
          };
        } else {
          throw new Error(
            "[new Asar] File entry not found in directory structure"
          );
        }
      }

      if (isLastChunk) {
        // This is the last chunk, so we can assume it's a file
        (currentDir[pathChunk] as FileEntryData).data = data;
        (currentDir[pathChunk] as FileEntryData).size = data.length;
        (currentDir[pathChunk] as FileEntryData).offset = "";
        return;
      }

      currentDir = (currentDir[pathChunk] as DirectoryEntryData).files;
    }
  }

  /**
   * Extracts the Asar archive to a directory
   * @param output The directory to extract to
   */
  async extract(output: string) {
    await mkdir(output, {
      recursive: true,
    });

    for (const [, filePathChunks, fileEntry] of this.walkFiles(true)) {
      if (BaseEntry.isDirectory(fileEntry)) {
        const fileDirPath = joinPaths(output, ...filePathChunks);

        await mkdir(fileDirPath, {
          recursive: true,
        });
      } else {
        const filePath = joinPaths(output, ...filePathChunks);

        const fileData = this.readFile(fileEntry);

        await writeFile(filePath, fileData);
      }
    }
  }

  /**
   * Gets the Asar archive data
   * @param opts Options for getting the data and what to return
   * @returns The Asar archive data, and more if specified in the options
   */
  getData(opts: Partial<AsarGetDataOptions> = {}) {
    const headerData: DirectoryEntryData = {
      files: {},
    };

    let lastFileOffset = 0;

    const entries = [...this.walkFiles()];

    if (!opts.noSort) {
      // sort alphabetically
      entries.sort((a, b) => {
        const aPath = a[1].join("/");
        const bPath = b[1].join("/");
        return aPath.localeCompare(bPath);
      });
    }

    for (const i in entries) {
      const [, filePath, fileEntry] = entries[i];
      let currentDir = headerData.files;

      for (const pathChunk of filePath) {
        if (!(pathChunk in currentDir)) {
          if (BaseEntry.isFile(fileEntry)) {
            currentDir[pathChunk] = {
              ...fileEntry,
              offset: lastFileOffset.toString(),
            };

            // File integrity
            if (
              !opts.noRecalculateIntegrity ||
              (currentDir[pathChunk] as FileEntryData).integrity == undefined
            ) {
              (currentDir[pathChunk] as FileEntryData).integrity =
                FileEntry.calculateIntegrity(
                  (currentDir[pathChunk] as FileEntryData).data
                );
            }

            // Remove file data
            delete (currentDir[pathChunk] as FileEntryData).data;

            // Update offset
            (entries[i][2] as FileEntry).offset = (
              currentDir[pathChunk] as FileEntryData
            ).offset;

            // Update lastFileOffset
            lastFileOffset += fileEntry.size;
          } else if (BaseEntry.isDirectory(fileEntry)) {
            currentDir[pathChunk] = {
              files: {},
            };
          } else {
            throw new Error("[Asar.getData] Unknown entry type");
          }
        }
        currentDir = (currentDir[pathChunk] as DirectoryEntryData).files;
      }
    }

    const headerDataStr = JSON.stringify(headerData);
    const headerPickle = createEmpty();
    if (!headerPickle.writeString(headerDataStr)) {
      throw new Error("[Asar.getData] Failed to write header data to Pickle");
    }
    const headerDataBuf = headerPickle.toBuffer();

    const headerSizePickle = createEmpty();
    if (!headerSizePickle.writeUInt32(headerDataBuf.length)) {
      throw new Error("[Asar.getData] Failed to write header size to Pickle");
    }
    const headerSizeDataBuf = headerSizePickle.toBuffer();

    const bufs = [headerSizeDataBuf, headerDataBuf];

    for (const [, filePath, fileEntry] of entries) {
      if (BaseEntry.isFile(fileEntry)) {
        const fileDataBuf = this.readFile(filePath);

        if (fileDataBuf == undefined) {
          console.error(filePath, fileEntry);
          throw new Error("[Asar.getData] File data not found");
        }

        if (fileDataBuf.length != fileEntry.size) {
          throw new Error("[Asar.getData] File size mismatch");
        }

        bufs.push(fileDataBuf);
      }
    }

    const buf = new Uint8Array(bufs.reduce((acc, buf) => acc + buf.length, 0));

    let offset = 0;
    for (const iterBuf of bufs) {
      buf.set(iterBuf, offset);
      offset += iterBuf.length;
    }

    const returnValue: {
      /**
       * The raw Asar archive data that can be saved to a file.
       */
      bytes: Uint8Array;

      rawHeader?: Uint8Array;
      rawHeaderSize?: number;
      headerString?: string;
      header?: DirectoryEntryData;
    } = { bytes: buf };
    if (opts.returnRawHeader) {
      returnValue.rawHeader = headerDataBuf;
    }
    if (opts.returnRawHeaderSize) {
      returnValue.rawHeaderSize = headerDataBuf.length;
    }
    if (opts.returnHeaderString) {
      returnValue.headerString = headerDataStr;
    }
    if (opts.returnHeader) {
      returnValue.header = headerData;
    }
    return returnValue;
  }

  /**
   * Gets the Asar archive data and saves it to a file
   * @param asarPath The path to save the Asar archive to
   * @param opts Options passed to `Asar.getData`
   */
  async saveData(asarPath: string, opts: Partial<AsarGetDataOptions> = {}) {
    const asarData = this.getData(opts);

    await writeFile(asarPath, asarData.bytes);
  }
}
