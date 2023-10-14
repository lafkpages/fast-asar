import { rm } from "fs/promises";

const outdir = "dist";

await rm(outdir, { recursive: true, force: true });

await Bun.build({
  entrypoints: ["src/index.ts"],
  target: "node",
  minify: true,
  sourcemap: "external",
  outdir,
  splitting: true,
});
