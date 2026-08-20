import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { __CCVERBS_VERSION__: JSON.stringify("0.0.0-test") },
  test: { environment: "node", include: ["tests/**/*.test.ts?(x)"] },
});
