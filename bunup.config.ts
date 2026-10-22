import { defineConfig } from "bunup";

export default defineConfig({
  entry: ["src/index.ts", "src/react/index.ts", "src/next/index.ts"],
  outDir: "dist",
  format: "esm",
  target: "browser",
  dts: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "next",
    "next/script",
    "@next/third-parties",
    /^@next\/third-parties\/.*/,
  ],
  splitting: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
