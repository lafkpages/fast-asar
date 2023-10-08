import { headerSizeMetadata, headerMetadata } from "./consts";
import { createFromBuffer } from "@tybys/chromium-pickle-js";

export class Asar {
  private data: Uint8Array;
  private headerSize: number;
  private rawHeader: string;
  private header: any;

  constructor(data: Uint8Array) {
    this.data = data;

    this.headerSize = this.readHeaderSize();
    this.rawHeader = this.readHeader();
    this.header = JSON.parse(this.rawHeader);
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
