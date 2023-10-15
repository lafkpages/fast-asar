let colors: typeof import("ansi-colors");
try {
  colors = await import("ansi-colors");
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
