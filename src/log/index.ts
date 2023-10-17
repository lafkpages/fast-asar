import { colors } from "./colors";

/**
 * Logs an error message to the console.
 * This will be prefixed with "error:" in red.
 * @param message The message to log.
 */
export function error(message: string) {
  console.error(colors.red("error") + colors.gray(":"), colors.reset(message));
}

export const ok = colors.ok;

export { colors };
