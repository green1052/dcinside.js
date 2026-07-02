import dtsx from "bun-plugin-dtsx";

await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "dist",
    target: "node",
    minify: true,
    plugins: [dtsx()]
});