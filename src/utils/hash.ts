import { createHash } from "crypto";

/**
 * Hashes the given data using SHA256.
 *
 * If running in Bun, this will use `Bun.CryptoHasher`.
 * Otherwise, it will use Node's `crypto` module.
 *
 * @param data The data to hash
 * @returns The hash of the data
 */
export function sha256(data: string | Uint8Array): string {
  // If running in Bun, use Bun.CryptoHasher
  // instead of Node's crypto module because
  // it should be faster
  if (process.versions.bun) {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(data);
    return hasher.digest("hex");
  }

  return createHash("sha256").update(data).digest("hex");
}
