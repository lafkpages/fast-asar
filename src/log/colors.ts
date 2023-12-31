/**
 * The `ansi-colors` module, or a proxy that returns itself when any property
 * is accessed if `ansi-colors` is not installed.
 *
 * This is used so that the `ansi-colors` module can be imported and used as normal
 * without causing an error if `ansi-colors` is not installed.
 */
let colors: typeof import("ansi-colors");

try {
  colors = await import("ansi-colors");

  if (process.env.NO_COLOR) {
    colors.enabled = false;
  }
} catch {
  // If ansi-colors is not installed, return a proxy that returns itself
  // when any property is accessed
  // @ts-expect-error
  colors = new Proxy((a: string) => a, {
    get() {
      return colors;
    },
  });

  // This is done so that if color functions are called, they will
  // just return the string that was passed to them without any
  // colors, instead of throwing an error because the function
  // doesn't exist.

  // So for example, the following code would log "Hello, world!"
  // in red if ansi-colors is installed, and just "Hello, world!"
  // with no colors if it isn't installed:
  //
  // console.log(colors.red("Hello, world!"));
}

export { colors };
