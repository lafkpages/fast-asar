import { createHash } from "crypto";

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
