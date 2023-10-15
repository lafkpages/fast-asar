import { colors } from "./colors";

export function error(message: string) {
  console.error(colors.red("error") + colors.gray(":"), colors.reset(message));
}

export const ok = colors.ok;

export { colors };
