export const headerSizeMetadata = {
  offset: 0,
  size: 8,
} as const;
export const headerMetadata = {
  offset: headerSizeMetadata.offset + headerSizeMetadata.size,
} as const;
