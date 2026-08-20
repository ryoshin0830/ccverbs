import { describe, expect, it } from "vitest";
import { en } from "../../web/i18n/en";
import { ja } from "../../web/i18n/ja";
import { ko } from "../../web/i18n/ko";
import { zhHans } from "../../web/i18n/zh-Hans";
import { zhHant } from "../../web/i18n/zh-Hant";

type Node = Record<string, unknown>;

const CATALOGS = { en, ja, "zh-Hans": zhHans, "zh-Hant": zhHant, ko };

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

const enShape = shape(en as unknown as Node);
const locales = Object.keys(CATALOGS) as (keyof typeof CATALOGS)[];

describe("web catalogs", () => {
  it("ships the same five locales as the CLI", () => {
    expect(locales).toEqual(["en", "ja", "zh-Hans", "zh-Hant", "ko"]);
  });

  it.each(locales)("%s has exactly the same keys as en", (locale) => {
    const s = shape(CATALOGS[locale] as unknown as Node);
    expect([...s.keys()].sort()).toEqual([...enShape.keys()].sort());
  });

  it.each(locales)("%s function values take the same arguments as en", (locale) => {
    const s = shape(CATALOGS[locale] as unknown as Node);
    for (const [path, arity] of enShape) {
      if (typeof arity === "number") expect(s.get(path), path).toBe(arity);
    }
  });

  it.each(locales)("%s has no empty strings", (locale) => {
    const empty: string[] = [];
    const walk = (node: Node, prefix = "") => {
      for (const [key, value] of Object.entries(node)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string" && value.trim() === "") empty.push(path);
        else if (value !== null && typeof value === "object") walk(value as Node, path);
      }
    };
    walk(CATALOGS[locale] as unknown as Node);
    expect(empty).toEqual([]);
  });

  it("marks en and ja reviewed, the rest not", () => {
    expect(en.meta.reviewed).toBe(true);
    expect(ja.meta.reviewed).toBe(true);
    for (const locale of ["zh-Hans", "zh-Hant", "ko"] as const) {
      expect(CATALOGS[locale].meta.reviewed, locale).toBe(false);
    }
  });

  it.each(locales)("%s actually translates away from English", (locale) => {
    if (locale === "en") return;
    expect(CATALOGS[locale].words.heading).not.toBe(en.words.heading);
    expect(CATALOGS[locale].send.button).not.toBe(en.send.button);
  });

  it("covers every language and category name the app can show", () => {
    for (const locale of locales) {
      const c = CATALOGS[locale];
      for (const l of ["ja", "en", "zh-Hans", "zh-Hant", "ko", "mixed"] as const) {
        expect(c.inferred.languages[l], `${locale}.${l}`).toBeTruthy();
      }
      for (const k of ["meme", "study", "classic"] as const) {
        expect(c.inferred.categories[k], `${locale}.${k}`).toBeTruthy();
      }
    }
  });
});
