import {dts} from "bun-plugin-dtsx";

await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "dist",
    target: "node",
    packages: "external",
    minify: false,
    plugins: [dts()]
});