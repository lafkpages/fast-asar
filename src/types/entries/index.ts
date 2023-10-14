import type { FileEntry, DirectoryEntry } from "../..";

import type { FileEntryData } from "./file";
import type { DirectoryEntryData } from "./dir";

export type EntryData = FileEntryData | DirectoryEntryData;
export type Entry = FileEntry | DirectoryEntry;

export type { FileEntry, FileEntryData, DirectoryEntry, DirectoryEntryData };
