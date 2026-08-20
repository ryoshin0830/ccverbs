import type { Options } from "../args.js";
import { EXIT } from "../constants.js";
import {
  localizedDescription,
  localizedName,
  type VerbSet,
} from "../registry/schema.js";
import { groupByLocale, searchSets } from "../selection.js";
import { pad, type CommandDeps } from "./io.js";

function summary(set: VerbSet) {
  return {
    id: set.id,
    name: set.name,
    emoji: set.emoji,
    description: set.description,
    language: set.language,
    category: set.category,
    tags: set.tags,
    count: set.verbs.length,
  };
}

function renderTable(sets: VerbSet[], deps: CommandDeps, grouped: boolean): string[] {
  const { t, locale } = deps;
  if (sets.length === 0) return [t.list.noneMatched];

  const idWidth = Math.max(...sets.map((s) => s.id.length));
  const lines: string[] = [];
  let banded = false;

  for (const set of sets) {
    // One rule between "my language" and everything else, so the grouping is
    // visible rather than mysterious.
    if (grouped && !banded && set.language !== locale && set.language !== "mixed") {
      lines.push(`   ${"-".repeat(idWidth + 4)} ${t.list.otherLanguages}`);
      banded = true;
    }
    const count = String(set.verbs.length).padStart(3);
    lines.push(
      `${pad(set.emoji, 2)}  ${pad(set.id, idWidth)}  ${count}  ${localizedDescription(set, locale)}`,
    );
  }
  return lines;
}

export function runList(options: Options, deps: CommandDeps, subset?: VerbSet[]): number {
  const { io, t, locale } = deps;
  const matched = subset ?? deps.registry.sets;
  const totalVerbs = matched.reduce((n, s) => n + s.verbs.length, 0);

  if (options.json) {
    // Always id-ordered: an agent's view must not shift with the user's locale.
    const ordered = [...matched].sort((a, b) => a.id.localeCompare(b.id));
    io.out(
      JSON.stringify({
        ok: true,
        totalSets: ordered.length,
        totalVerbs,
        registryTotalSets: deps.registry.totalSets,
        sets: ordered.map(summary),
      }),
    );
    return EXIT.OK;
  }

  const ordered = options.group ? groupByLocale(matched, locale) : matched;
  for (const line of renderTable(ordered, deps, options.group)) io.out(line);
  io.out("");
  io.out(t.list.totals(ordered.length, totalVerbs));
  return EXIT.OK;
}

export function runSearch(options: Options, deps: CommandDeps): number {
  return runList(options, deps, searchSets(deps.registry.sets, options.arg ?? ""));
}

export function runShow(options: Options, deps: CommandDeps): number {
  const { io, t, locale } = deps;
  const set = deps.registry.sets.find((s) => s.id === options.arg);
  if (!set) {
    if (options.json) {
      io.out(
        JSON.stringify({
          ok: false,
          error: { code: "set-not-found", message: t.errors.setNotFound(options.arg ?? "") },
        }),
      );
    } else {
      io.err(`ccverbs: ${t.errors.setNotFound(options.arg ?? "")}`);
    }
    return EXIT.NOT_FOUND;
  }

  if (options.json) {
    io.out(JSON.stringify({ ok: true, set }));
    return EXIT.OK;
  }

  io.out(`${set.emoji} ${localizedName(set, locale)}  (${set.id})`);
  io.out(localizedDescription(set, locale));
  io.out(`${set.language} · ${set.category} · ${set.tags.join(", ") || t.list.noTags}`);
  if (set.author) io.out(t.list.byAuthor(set.author.name));
  if (set.source) io.out(set.source);
  io.out("");
  for (const verb of set.verbs) io.out(`  ${verb}…`);
  io.out("");
  io.out(t.list.verbTotal(set.verbs.length));
  return EXIT.OK;
}
