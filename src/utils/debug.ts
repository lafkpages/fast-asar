export const debugLevel = process.env.FAST_ASAR_DEBUG
  ? parseInt(process.env.FAST_ASAR_DEBUG)
  : 0;

export function debug(level: number, ...args: Parameters<Console["debug"]>) {
  if (debugLevel >= level) {
    console.debug(...args);
  }
}
