import { normalize as normalizePath } from "path";
import { createFromBuffer, createEmpty } from "@tybys/chromium-pickle-js";

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
    const headerSizeBuf = this.data.subarray(8, 16);
    const headerSizePickle = createFromBuffer(headerSizeBuf);
    return headerSizePickle.createIterator().readInt();
  }

  private readHeader() {
    const headerBuf = this.data.subarray(16, 7 + this.headerSize);
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

  writeFile(path: string, data: string | Uint8Array) {
    path = normalizePath(path);
    // TODO: split into chunks

    if (typeof data == "string") {
      data = Buffer.from(data, "utf-8");
    }

    this.header.data.files[path] = {
      size: data.length,
      offset: (this.data.length - this.headerSize - 8).toString(),
    };

    const newData = new Uint8Array(this.data.length + data.length);
    newData.set(this.data);
    newData.set(data, this.data.length);
    this.data = newData;
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
    return this.getFileOffset() + 8 + asar.headerSize;
  }
}

export interface ListFilesOptions {
  recursive: boolean;
  chunks?: boolean;
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

  listFiles(
    opts: Partial<ListFilesOptions> = {},
    _path: string | string[] | null = null
  ) {
    const files: string[] | string[][] = [];

    const realOpts: ListFilesOptions = {
      recursive: false,
      chunks: false,
      ...opts,
    };

    for (let filename in this.data.files) {
      const absPath = realOpts.chunks
        ? [...(_path ?? []), filename]
        : _path == null
        ? filename
        : _path + "/" + filename;

      const entry = this.data.files[filename]!;

      if (Entry.isFileData(entry)) {
        files.push(absPath);
      } else if (Entry.isDirectoryData(entry)) {
        if (realOpts.recursive) {
          const dir = this.getFromPath(filename);
          if (!Entry.isDirectory(dir)) {
            throw new Error(
              "[DirectoryEntry.listFiles] Intermediate entry is not a directory"
            );
          }
          const subFiles = dir.listFiles(realOpts, absPath);
          files.push(...subFiles);
        } else {
          files.push(absPath);
        }
      } else {
        throw new Error("[DirectoryEntry.listFiles] Unknown entry type");
      }
    }

    return files;
  }
}

export class Header extends DirectoryEntry {
  size: number;

  constructor(rawHeader: string) {
    super(JSON.parse(rawHeader));
    this.size = rawHeader.length;
  }

  getRawData() {
    return JSON.stringify(this.data);
  }

  getRawAsarData() {
    const headerJsonData = this.getRawData();
    const headerPickle = createEmpty();
    headerPickle.writeString(headerJsonData); // TODO: check return val

    const headerSizePickle = createEmpty();
    headerSizePickle.writeInt(headerJsonData.length);
    const headerSizeData = headerSizePickle.toBuffer(); // TODO: ^^
  }
}
