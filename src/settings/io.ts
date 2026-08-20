import { copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { BACKUP_SUFFIX, TMP_SUFFIX } from "../constants.js";

export interface SettingsFile {
  data: Record<string, unknown>;
  indent: number;
  trailingNewline: boolean;
  existed: boolean;
}

export function readSettings(path: string): SettingsFile {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return { data: {}, indent: 2, trailingNewline: true, existed: false };
  }

  const data = JSON.parse(raw) as Record<string, unknown>;
  const match = raw.match(/\n([ \t]+)"/);
  const captured = match?.[1];
  const indent = !captured || captured.includes("\t") ? 2 : captured.length;
  return { data, indent, trailingNewline: raw.endsWith("\n"), existed: true };
}

export function writeSettings(
  path: string,
  data: Record<string, unknown>,
  opts: { indent: number; trailingNewline: boolean; backup: boolean },
): { backupPath: string | null } {
  mkdirSync(dirname(path), { recursive: true });

  let backupPath: string | null = null;
  if (opts.backup) {
    try {
      copyFileSync(path, `${path}${BACKUP_SUFFIX}`);
      backupPath = `${path}${BACKUP_SUFFIX}`;
    } catch {
      backupPath = null; // Nothing to back up on a first write.
    }
  }

  const body = JSON.stringify(data, null, opts.indent) + (opts.trailingNewline ? "\n" : "");
  const tmp = `${path}${TMP_SUFFIX}`;
  writeFileSync(tmp, body, "utf8");
  renameSync(tmp, path);

  try {
    JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (backupPath) copyFileSync(backupPath, path);
    rmSync(tmp, { force: true });
    throw new Error(`wrote invalid JSON to ${path}: ${(error as Error).message}`);
  }

  return { backupPath };
}
