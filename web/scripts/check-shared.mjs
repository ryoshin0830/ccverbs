// Lolipop uploads whatever directory `lolipop deploy` runs in. This app imports
// ../src, so the deploy must run from the repository root with `--root web`.
// Without this check the failure is four cryptic module-not-found errors.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const required = [
  "../../src/contrib/build.ts",
  "../../src/contrib/validate.ts",
  "../../src/contrib/types.ts",
  "../../src/registry/width.ts",
];

const missing = required.filter((p) => !existsSync(fileURLToPath(new URL(p, import.meta.url))));

if (missing.length > 0) {
  console.error("\nccverbs-web: the shared sources are not here:");
  for (const p of missing) console.error(`  missing ${p}`);
  console.error("\nThis app imports ../src, so the upload has to include the repository root.");
  console.error("Deploy from the repo root, not from web/:\n");
  console.error("  cd <repo root> && lolipop deploy --name ccverbs --framework next --root web\n");
  process.exit(1);
}
