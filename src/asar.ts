import { normalize as normalizePath } from "path";
import { createFromBuffer, createEmpty } from "@tybys/chromium-pickle-js";

import { BaseEntry, FileEntry, DirectoryEntry } from "./entries";

import type { Entry, FileEntryData, DirectoryEntryData } from "./types/entries";

export interface AsarOptions {
  storeInitialParseData: boolean;
}

export interface AsarInitialParseData {
  headerSize: number;
  header: DirectoryEntryData;
  rawHeader: string;
}

export interface AsarGetDataOptions {
  noSort: boolean;
  noRecalculateIntegrity: boolean;
  returnRawHeader: boolean;
  returnRawHeaderSize: boolean;
  returnHeader: boolean;
}

export class Asar extends DirectoryEntry {
  initialParseData?: AsarInitialParseData;

  constructor(asarBytes: Uint8Array, opts: Partial<AsarOptions> = {}) {
    // Read header size
    const headerSize = createFromBuffer(asarBytes.subarray(0, 16))
      .createIterator()
      .readUInt32();

    // Read header
    // We start at 16 because 0-8 are the Pickle object containing
    // the header size, and 9-15 are the header size itself
    const rawHeader = asarBytes.subarray(16, headerSize + 16).toString();
    const header = JSON.parse(rawHeader) as unknown;

    // Ensure header is an object
    if (typeof header != "object" || header == null) {
      throw new Error("[new Asar] Invalid header (not an object)");
    }

    // Ensure header conforms to directory structure
    if (!BaseEntry.isDirectory(header)) {
      throw new Error("[new Asar] Invalid header (not a directory)");
    }

    super(header);

    if (opts.storeInitialParseData) {
      this.initialParseData = {
        headerSize,
        header,
        rawHeader,
      };
    }

    // Read all files
    for (const [, filePath, fileEntry] of this.walkFiles(false)) {
      // We can assume that fileEntry is a FileEntry,
      // because we specified walkFiles(false)
      const offset = (fileEntry as FileEntry).getOffsetFromAsarData(headerSize);
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

  readFile(path: Entry | Parameters<DirectoryEntry["getFromPath"]>[0]) {
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

  writeFile(path: string, data: string | Uint8Array) {
    path = normalizePath(path);
    // TODO: split into chunks

    if (typeof data == "string") {
      data = Buffer.from(data, "utf-8");
    }

    this.files[path] = {
      size: data.length,
      offset: "",
      data,
    };
  }

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
    if (!headerSizePickle.writeUInt32(headerDataStr.length + 9)) {
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
      bytes: Uint8Array;
      rawHeader?: string;
      rawHeaderSize?: number;
      header?: DirectoryEntryData;
    } = { bytes: buf };
    if (opts.returnRawHeader) {
      returnValue.rawHeader = headerDataStr;
    }
    if (opts.returnRawHeaderSize) {
      returnValue.rawHeaderSize = headerDataStr.length;
    }
    if (opts.returnHeader) {
      returnValue.header = headerData;
    }
    return returnValue;
  }
}
