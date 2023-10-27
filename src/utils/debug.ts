export const debugEnabled = process.env.FAST_ASAR_DEBUG == "1";
export const debug = debugEnabled ? console.debug : () => {};
