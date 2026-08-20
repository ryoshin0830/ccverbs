import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "sets");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".json") && f !== "index.json")
  .sort();
const sets = files
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")))
  .sort((a, b) => a.id.localeCompare(b.id));

const index = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  totalSets: sets.length,
  totalVerbs: sets.reduce((n, s) => n + s.verbs.length, 0),
  sets,
};

writeFileSync(join(dir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`sets/index.json: ${index.totalSets} sets, ${index.totalVerbs} verbs`);
