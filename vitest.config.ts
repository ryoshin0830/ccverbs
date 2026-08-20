import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { __CCVERBS_VERSION__: JSON.stringify("0.0.0-test") },
  resolve: {
    alias: { "@ccverbs": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { environment: "node", include: ["tests/**/*.test.ts?(x)"] },
});
