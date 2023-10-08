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
}

export class Header {
  private data: any;

  constructor(rawHeader: string) {
    this.data = JSON.parse(rawHeader);
  }

  getFromPath(path: string) {
    const chunks = path.split("/");

    let current = this.data;

    for (let _i in chunks) {
      const i = parseInt(_i);
      const chunk = chunks[i];

      if (!current.files) {
        return null;
      }

      current = current.files[chunk];

      if (!current) {
        return null;
      }

      if (i == chunks.length - 1) {
        return current;
      }
    }
  }

  isDirectory(path: string) {
    const entry = this.getFromPath(path);

    return !!(entry && entry.files);
  }
}
