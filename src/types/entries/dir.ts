import type { EntryData } from ".";

export interface DirectoryEntryData {
  files: {
    [filename: string]: EntryData | undefined;
  };
}
