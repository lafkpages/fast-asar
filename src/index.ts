import { headerMetadata } from "./consts";
import { createFromBuffer } from "@tybys/chromium-pickle-js";

export class Asar {
  private data: Uint8Array;
  private headerSize: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.headerSize = this.readHeaderSize();
  }

  private readHeaderSize() {
    const headerSizeBuf = this.data.subarray(
      headerMetadata.offset,
      headerMetadata.offset + headerMetadata.size
    );
    const headerSizePickle = createFromBuffer(headerSizeBuf);
    return headerSizePickle.createIterator().readInt();
  }
}
