// Build types
const tsc = Bun.spawn(["./node_modules/.bin/tsc"]);
await tsc.exited;

// Build the project
await Bun.build({
  entrypoints: ["src/index.ts", "src/cli/index.ts"],
  root: "src",
  target: "node",
  minify: true,
  sourcemap: "external",
  outdir: "dist",
});

export {};
