import { normalize as normalizePath } from "path";
import { headerSizeMetadata, headerMetadata } from "./consts";
import { createFromBuffer } from "@tybys/chromium-pickle-js";

export class Asar {
  data: Uint8Array;

  private _headerSize: number | null;
  private _rawHeader: string | null;
  private _header: Header | null;

  constructor(data: Uint8Array) {
    this.data = data;

    // Lazy initialization.
    // This is done so that if the user doesn't need
    // the header, it won't be parsed.
    this._headerSize = null;
    this._rawHeader = null;
    this._header = null;
  }

  get headerSize() {
    if (this._headerSize == null) {
      this._headerSize = this.readHeaderSize();
    }

    return this._headerSize;
  }

  get rawHeader() {
    if (this._rawHeader == null) {
      this._rawHeader = this.readHeader();
    }

    return this._rawHeader;
  }

  get header() {
    if (this._header == null) {
      this._header = new Header(this.rawHeader);
    }

    return this._header;
  }

  private readHeaderSize() {
    const headerSizeBuf = this.data.subarray(
      headerSizeMetadata.start,
      headerSizeMetadata.end
    );
    const headerSizePickle = createFromBuffer(headerSizeBuf);
    return headerSizePickle.createIterator().readInt();
  }

  private readHeader() {
    const headerBuf = this.data.subarray(
      headerMetadata.start,
      headerMetadata.end(this.headerSize)
    );
    return headerBuf.toString();
  }

  readFile(path: Entry | string) {
    const entry = path instanceof Entry ? path : this.header.getFromPath(path);

    if (!Entry.isFile(entry)) {
      console.error(entry);
      throw new Error("[Asar.readFile] Entry is not a file: " + path);
    }

    const offset = entry.getFileOffsetFromAsar(this);
    const fileSize = entry.data.size;

    const dataBuf = this.data.subarray(offset, offset + fileSize);

    return dataBuf;
  }
}

export interface FileEntryData {
  size: number;
  offset: string;
  integrity?: any; // TODO
}

export interface DirectoryEntryData {
  files: {
    [filename: string]: EntryData | undefined;
  };
}

export type EntryData = FileEntryData | DirectoryEntryData;

export class Entry {
  data: EntryData;

  constructor(data: EntryData) {
    this.data = data;
  }

  static fromData(data: EntryData) {
    if (this.isDirectoryData(data)) {
      return new DirectoryEntry(data);
    } else if (this.isFileData(data)) {
      return new FileEntry(data);
    } else {
      throw new Error("[Entry.fromData] Unknown entry type");
    }
  }

  static isDirectoryData(
    entryData: EntryData
  ): entryData is DirectoryEntryData {
    return "files" in entryData;
  }

  static isFileData(entryData: EntryData): entryData is FileEntryData {
    return "size" in entryData;
  }

  static isDirectory(entry: Entry): entry is DirectoryEntry {
    return this.isDirectoryData(entry.data);
  }

  static isFile(entry: Entry): entry is FileEntry {
    return this.isFileData(entry.data);
  }
}

export class FileEntry extends Entry {
  declare data: FileEntryData;

  constructor(data: FileEntryData) {
    super(data);
  }

  getFileOffset() {
    return parseInt(this.data.offset);
  }

  getFileOffsetFromAsar(asar: Asar) {
    return this.getFileOffset() + headerMetadata.end(asar.headerSize) + 1;
  }
}

export class DirectoryEntry extends Entry {
  declare data: DirectoryEntryData;

  constructor(data: DirectoryEntryData) {
    super(data);
  }

  getFromPath(path: string) {
    path = normalizePath(path);
    const chunks = [...path.split("/"), null];

    let currentEntry: EntryData = this.data;

    for (let _i in chunks) {
      const i = parseInt(_i);
      const isLastChunk = i == chunks.length - 1;

      if (isLastChunk) {
        return Entry.fromData(currentEntry);
      } else {
        const chunk = chunks[i]!;

        // Intermediate entries must be directories
        if (!Entry.isDirectoryData(currentEntry)) {
          throw new Error(
            "[DirectoryEntry.getFromPath] Intermediate entry is not a directory"
          );
        }

        const nextEntry: EntryData | undefined = currentEntry.files[chunk];

        if (nextEntry == undefined) {
          throw new Error(
            "[DirectoryEntry.getFromPath] Intermediate entry not found"
          );
        }

        currentEntry = nextEntry;
      }
    }

    throw new Error("[DirectoryEntry.getFromPath] Unreachable");
  }

  listFiles() {
    return Object.keys(this.data.files);
  }
}

export class Header extends DirectoryEntry {
  size: number;

  constructor(rawHeader: string) {
    super(JSON.parse(rawHeader));
    this.size = rawHeader.length;
  }
}
