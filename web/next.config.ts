import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const REPO = fileURLToPath(new URL("..", import.meta.url));

const nextConfig: NextConfig = {
  // Required by Lolipop's Next.js framework preset.
  output: "standalone",
  // The validation logic lives in ../src so the CLI and this app share one copy.
  experimental: { externalDir: true },
  // Two lockfiles exist (the CLI and this app); say which root to trace from.
  outputFileTracingRoot: REPO,
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
