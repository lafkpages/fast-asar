export const headerSizeMetadata = {
  start: 8,
  end: 16,
} as const;
export const headerMetadata = {
  start: headerSizeMetadata.end,
  end(headerSize: number) {
    return this.start + headerSize;
  },
} as const;
