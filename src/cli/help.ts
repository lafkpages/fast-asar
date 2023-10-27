import { colors } from "../log";

export function help(exit: number | false = 0) {
  // If exiting with a non-zero exit code,
  // print the error message to stderr
  console[exit !== false && exit !== 0 ? "error" : "log"](
    colors.reset(`${colors.magenta.bold("Usage:")} ${colors.green(
      "fast-asar"
    )} ${colors.blue("<command>")}

${colors.blue.bold("Commands:")}
  ${colors.blue("extract")} ${colors.yellow(
      "<archive> <output>"
    )}  Extract an archive
  ${colors.blue("pack")} ${colors.yellow(
      "<input> <archive>"
    )}      Pack a directory into an archive
  ${colors.blue("list")} ${colors.yellow(
      "<archive>"
    )}              List the contents of an archive
  ${colors.blue("inspect")} ${colors.yellow(
      "<archive>"
    )}           Inspect an archive (mostly for debugging)
  ${colors.blue("help")}                        Show this help message

${colors.magenta.bold("Examples:")}
  ${colors.magenta("bunx")} ${colors.green("fast-asar")} ${colors.blue(
      "extract"
    )} ${colors.yellow("app.asar app/")}
  ${colors.magenta("bunx")} ${colors.green("fast-asar")} ${colors.blue(
      "pack"
    )} ${colors.yellow("app/ app.asar")}
  ${colors.magenta("bunx")} ${colors.green("fast-asar")} ${colors.blue(
      "list"
    )} ${colors.yellow("app.asar")}
  ${colors.magenta("bunx")} ${colors.green("fast-asar")} ${colors.blue(
      "inspect"
    )} ${colors.yellow("app.asar")}
  ${colors.magenta("bunx")} ${colors.green("fast-asar")} ${colors.blue(
      "help"
    )}`)
  );

  if (exit !== false) {
    process.exit(exit);
  }
}
