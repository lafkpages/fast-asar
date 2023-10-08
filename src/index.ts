import { normalize as normalizePath } from "path";
import { headerSizeMetadata, headerMetadata } from "./consts";
import { createFromBuffer } from "@tybys/chromium-pickle-js";

export class Asar {
  private data: Uint8Array;
  private headerSize: number;
  private rawHeader: string;
  private header: Header;

  constructor(data: Uint8Array) {
    this.data = data;

    this.headerSize = this.readHeaderSize();
    this.rawHeader = this.readHeader();
    this.header = new Header(this.rawHeader);
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

  isDirectory(...args: Parameters<Header["isDirectory"]>) {
    return this.header.isDirectory(...args);
  }

  isFile(...args: Parameters<Header["isFile"]>) {
    return this.header.isFile(...args);
  }

  readFile(path: string) {
    const offset = this.header.getFileOffset(path);

    if (!offset) {
      return null;
    }

    const size = this.data.subarray(offset, offset + 8);
    const pickle = createFromBuffer(size);

    const sizeBuf = pickle.createIterator().readInt();
    const dataBuf = this.data.subarray(offset + 8, offset + 8 + sizeBuf);

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
  private data: EntryData;

  constructor(data: EntryData) {
    this.data = data;
  }

  getFromPath(path: Entry | string) {
    if (path instanceof Entry) {
      return path.data;
    }

    path = normalizePath(path);
    const chunks = path.split("/");

    let currentEntry = this.data;

    for (let _i in chunks) {
      const i = parseInt(_i);
      const chunk = chunks[i];

      if (!("files" in currentEntry)) {
        return null;
      }

      const nextEntry = currentEntry.files[chunk];

      if (!nextEntry) {
        return null;
      }
      currentEntry = nextEntry;

      if (i == chunks.length - 1) {
        return currentEntry;
      }
    }

    return null;
  }

  isDirectory(path: Entry | string) {
    const entry = this.getFromPath(path);

    return !!(entry && "files" in entry);
  }

  isFile(path: Entry | string) {
    const entry = this.getFromPath(path);

    return !!(entry && "size" in entry);
  }

  getFileOffset(path: Entry | string) {
    const entry = this.getFromPath(path);

    if (!entry) {
      return null;
    }

    if (!("offset" in entry)) {
      return null;
    }

    return parseInt(entry.offset);
  }
}

export class Header extends Entry {
  constructor(rawHeader: string) {
    super(JSON.parse(rawHeader));
  }
}
