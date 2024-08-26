import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  // sourcemap: true,
  clean: true,
  dts: true, // Generates .d.ts files for TypeScript types
});
