import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const HERE = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  // Required by Lolipop's Next.js framework preset.
  output: "standalone",
  // The validation logic lives in ../src so the CLI and this app share one copy.
  experimental: { externalDir: true },
  // Trace from this directory, not the repository root. Two lockfiles exist and
  // Next would otherwise pick the repo root, which nests the standalone output
  // at .next/standalone/web/server.js instead of .next/standalone/server.js.
  // Nothing from ../src is needed at runtime — it is bundled at build time — so
  // narrowing the tracing root is safe.
  outputFileTracingRoot: HERE,
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, "@ccverbs": SRC };
    // src/ imports with .js specifiers because the CLI ships ESM. Those files
    // are .ts on disk, so teach webpack the mapping.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
