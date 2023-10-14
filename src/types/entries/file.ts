export interface FileEntryData {
  size: number;
  offset: string;
  executable?: boolean;
  integrity?: {
    algorithm: "SHA256";
    hash: string;
    blockSize: number;
    blocks: string[];
  };
  data?: Uint8Array;
}
