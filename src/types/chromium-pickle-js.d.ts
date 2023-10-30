declare module "chromium-pickle-js" {
  export declare function createEmpty(): IPickle;

  export declare function createFromBuffer(buffer: Uint8Array): IPickle;

  export declare interface IPickle {
    header: Uint8Array;
    headerSize: number;
    initEmpty(): void;
    initFromBuffer(buffer: Uint8Array): void;
    createIterator(): IPickleIterator;
    toBuffer(): Uint8Array;
    writeBool(value: boolean): boolean;
    writeInt(value: number): boolean;
    writeUInt32(value: number): boolean;
    writeInt64(value: bigint | number): boolean;
    writeUInt64(value: bigint | number): boolean;
    writeFloat(value: number): boolean;
    writeDouble(value: number): boolean;
    writeString(value: string): boolean;
    setPayloadSize(payloadSize: number): number;
    getPayloadSize(): number;
    writeBytes(data: Uint8Array, length: number): boolean;
    writeBytes<T extends number | bigint>(
      data: T,
      length: number,
      method: (data: T, offset?: number) => number
    ): boolean;
    resize(newCapacity: number): void;
  }

  export declare interface IPickleIterator {
    readBool(): boolean;
    readInt(): number;
    readUInt32(): number;
    readInt64(): bigint;
    readUInt64(): bigint;
    readFloat(): number;
    readDouble(): number;
    readString(): string;
    readBytes(length: number): Uint8Array;
    readBytes<T extends number | bigint>(
      length: number,
      method: (this: Uint8Array, offset: number) => T
    ): T;
    getReadPayloadOffsetAndAdvance(length: number): number;
    advance(size: number): void;
  }

  export {};

  export as namespace chromiumPickle;
}
