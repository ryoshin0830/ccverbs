import { describe, expect, it } from "vitest";
import { COMMANDS, OPTIONS } from "../../src/help/model.js";
import { getCatalog } from "../../src/i18n/index.js";
import { SUPPORTED_LOCALES, UNREVIEWED_LOCALES } from "../../src/i18n/locales.js";

type Node = Record<string, unknown>;

/** Every leaf path, with function arity recorded so signatures can be compared. */
function shape(node: Node, prefix = ""): Map<string, number | "leaf"> {
  const out = new Map<string, number | "leaf">();
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "function") out.set(path, value.length);
    else if (value !== null && typeof value === "object") {
      for (const [k, v] of shape(value as Node, path)) out.set(k, v);
    } else out.set(path, "leaf");
  }
  return out;
}

const enShape = shape(getCatalog("en") as unknown as Node);

describe("catalogs", () => {
  it("ships all five locales", () => {
    for (const locale of SUPPORTED_LOCALES) expect(getCatalog(locale)).toBeDefined();
  });

  it.each(SUPPORTED_LOCALES)("%s has exactly the same keys as en", (locale) => {
    const s = shape(getCatalog(locale) as unknown as Node);
    expect([...s.keys()].sort()).toEqual([...enShape.keys()].sort());
  });

  it.each(SUPPORTED_LOCALES)("%s function values take the same arguments as en", (locale) => {
    const s = shape(getCatalog(locale) as unknown as Node);
    for (const [path, arity] of enShape) {
      if (typeof arity === "number") expect(s.get(path), path).toBe(arity);
    }
  });

  it.each(SUPPORTED_LOCALES)("%s has no empty string values", (locale) => {
    const empties: string[] = [];
    const walk = (node: Node, prefix = "") => {
      for (const [key, value] of Object.entries(node)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string" && value.trim() === "") empties.push(path);
        else if (value !== null && typeof value === "object") walk(value as Node, path);
      }
    };
    walk(getCatalog(locale) as unknown as Node);
    expect(empties).toEqual([]);
  });

  it("marks en and ja reviewed, and the rest not", () => {
    expect(getCatalog("en").meta.reviewed).toBe(true);
    expect(getCatalog("ja").meta.reviewed).toBe(true);
    for (const locale of UNREVIEWED_LOCALES) {
      expect(getCatalog(locale).meta.reviewed).toBe(false);
    }
  });

  it.each(SUPPORTED_LOCALES)("%s names itself in its own language", (locale) => {
    expect(getCatalog(locale).meta.nativeName.length).toBeGreaterThan(0);
  });

  it.each(SUPPORTED_LOCALES)("%s describes every command and option", (locale) => {
    const t = getCatalog(locale);
    for (const c of COMMANDS) expect(t.help.commands[c.name], c.name).toBeTruthy();
    for (const o of OPTIONS) expect(t.help.options[o.long], o.long).toBeTruthy();
  });

  it.each(SUPPORTED_LOCALES)("%s translates away from the English wording", (locale) => {
    if (locale === "en") return;
    const t = getCatalog(locale);
    expect(t.wizard.applyQuestion).not.toBe(getCatalog("en").wizard.applyQuestion);
    expect(t.config.title).not.toBe(getCatalog("en").config.title);
  });
});
