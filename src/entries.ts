import { normalize as normalizePath } from "path";

import { sha256 } from "./utils/hash";

import type {
  Entry,
  EntryData,
  FileEntryData,
  DirectoryEntryData,
} from "./types/entries";

/**
 * A base class for entries. This class is not meant to be used directly, but
 * rather to be extended by other classes.
 *
 * This class provides static methods for checking whether an entry is a file
 * or a directory, and for creating an entry from entry data.
 */
export class BaseEntry {
  /**
   * Creates an entry from the given entry data.
   * @param entryData The entry data to create the entry from.
   */
  static fromData(entryData: FileEntryData): FileEntry;
  static fromData(entryData: DirectoryEntryData): DirectoryEntry;
  static fromData(entryData: EntryData): Entry;
  static fromData(entryData: EntryData): Entry {
    if (this.isDirectory(entryData)) {
      return new DirectoryEntry(entryData);
    } else if (this.isFile(entryData)) {
      return new FileEntry(entryData);
    } else {
      throw new Error("[Entry.fromData] Unknown entry type");
    }
  }

  /**
   * Checks wether the given value is an entry.
   * @param entry The value to check.
   */
  static isEntry(entry: unknown): entry is Entry {
    return entry instanceof BaseEntry;
  }

  /**
   * Checks whether the given entry is a directory.
   * @param entry The entry or entry data to check.
   */
  static isDirectory(entry: BaseEntry): entry is DirectoryEntry;
  static isDirectory(entry: EntryData): entry is DirectoryEntryData;
  static isDirectory(entry: BaseEntry | EntryData): boolean {
    return "files" in entry;
  }

  /**
   * Checks whether the given entry is a file.
   * @param entry The entry or entry data to check.
   */
  static isFile(entry: BaseEntry): entry is FileEntry;
  static isFile(entry: EntryData): entry is FileEntryData;
  static isFile(entry: BaseEntry | EntryData): boolean {
    return "size" in entry;
  }
}

/**
 * A file entry.
 */
export class FileEntry extends BaseEntry implements FileEntryData {
  size;
  offset;
  integrity?;
  executable?;
  data?;

  constructor(data: FileEntryData) {
    super();
    this.size = data.size;
    this.offset = data.offset;
    this.integrity = data.integrity;
    this.executable = data.executable;
    this.data = data.data;
  }

  /**
   * The file's offset as specified in the ASAR header, but as a `number` instead of a `string`.
   */
  get offsetAsNumber() {
    return parseInt(this.offset);
  }

  /**
   * Gets the offset of the file's data in the ASAR archive.
   * @param headerSize The size of the ASAR header.
   */
  getOffsetFromAsarData(headerSize: number) {
    return this.offsetAsNumber + 17 + headerSize;
  }

  /**
   * Calculates the integrity of the given file data.
   * @param data The file data to calculate the integrity of.
   * @returns The integrity of the given file data, in the
   * same format as the `integrity` property of `FileEntryData`.
   */
  static calculateIntegrity(
    data: FileEntryData["data"]
  ): FileEntryData["integrity"] {
    if (data == undefined) {
      throw new Error("[FileEntry.calculateIntegrity] File data is undefined");
    }

    const hash = sha256(data);

    const blockSize = 4 * 1024 * 1024; // 4MB

    const blocks: string[] = [];

    if (data.length <= blockSize) {
      blocks.push(hash);
    } else {
      const blockCount = Math.ceil(data.length / blockSize);

      for (let i = 0; i < blockCount; i++) {
        const block = data.subarray(
          i * blockSize,
          Math.min((i + 1) * blockSize, data.length)
        );

        blocks.push(sha256(block));
      }
    }

    return {
      algorithm: "SHA256",
      hash,
      blockSize,
      blocks,
    };
  }

  /**
   * Calculates the integrity of this file's data.
   * @returns The integrity of the given file data, in the
   * same format as the `integrity` property of `FileEntryData`.
   */
  calculateIntegrity() {
    return FileEntry.calculateIntegrity(this.data);
  }
}

/**
 * A directory entry.
 */
export class DirectoryEntry extends BaseEntry implements DirectoryEntryData {
  files;

  constructor(data: DirectoryEntryData) {
    super();
    this.files = data.files;
  }

  /**
   * Gets the entry at the given path.
   * @param path The path or path chunks to get the entry at.
   */
  getFromPath(path: string | string[]) {
    let chunks: (string | null)[];
    if (Array.isArray(path)) {
      chunks = [...path, null];
    } else {
      path = normalizePath(path);
      chunks = [...path.split("/"), null];
    }

    let currentEntry: EntryData = this;

    for (let _i in chunks) {
      const i = parseInt(_i);
      const isLastChunk = i == chunks.length - 1;

      if (isLastChunk) {
        return BaseEntry.fromData(currentEntry);
      } else {
        const chunk = chunks[i]!;

        // Intermediate entries must be directories
        if (!BaseEntry.isDirectory(currentEntry)) {
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

  /**
   * Lists all files in this directory.
   * This is **not** recursive.
   * @returns A list of all files in this directory.
   */
  listFiles() {
    return Object.keys(this.files);
  }

  /**
   * Walks through the directory and recursively yields all files and directories.
   * @param includeDirectories Whether to include directories in the result.
   * @param _path Used internally for recursion.
   */
  *walkFiles(
    includeDirectories = true,
    _path: string[] | null = null
  ): Generator<readonly [string, string[], Entry], void, unknown> {
    for (const fileName of this.listFiles()) {
      const filePath = [...(_path ?? []), fileName];
      const fileEntryData = this.files[fileName];

      if (fileEntryData == undefined) {
        throw new Error("[DirectoryEntry.walkFiles] Unreachable");
      }

      const fileEntry = BaseEntry.fromData(fileEntryData);

      if (BaseEntry.isDirectory(fileEntry)) {
        if (includeDirectories) {
          yield [fileName, filePath, fileEntry] as const;
        }

        yield* fileEntry.walkFiles(includeDirectories, filePath);
      } else {
        yield [fileName, filePath, fileEntry] as const;
      }
    }
  }
}
