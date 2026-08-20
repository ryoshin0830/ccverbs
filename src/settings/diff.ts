import type { SpinnerVerbs } from "./apply.js";

function block(v: SpinnerVerbs, sign: "+" | "-"): string[] {
  const shown = v.verbs.slice(0, 3).map((verb) => `${sign}     ${JSON.stringify(verb)},`);
  const rest = v.verbs.length > 3 ? [`${sign}     ... ${v.verbs.length} verbs total`] : [];
  return [
    `${sign}   "mode": ${JSON.stringify(v.mode)},`,
    `${sign}   "verbs": [`,
    ...shown,
    ...rest,
    `${sign}   ]`,
  ];
}

export function renderDiff(before: SpinnerVerbs | null, after: SpinnerVerbs | null): string {
  if (!after) {
    return '-   "spinnerVerbs": removed (Claude Code falls back to its 186 built-in verbs)';
  }
  return [
    '    "spinnerVerbs": {',
    ...(before ? block(before, "-") : []),
    ...block(after, "+"),
    "    }",
  ].join("\n");
}
