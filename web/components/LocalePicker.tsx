"use client";

import { getCatalog, SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n";

interface LocalePickerProps {
  locale: SupportedLocale;
  label: string;
  onChange: (locale: SupportedLocale) => void;
}

export function LocalePicker({ locale, label, onChange }: LocalePickerProps) {
  return (
    <div className="locale">
      <label className="label" htmlFor="locale">
        {label}
      </label>
      <select
        id="locale"
        value={locale}
        onChange={(event) => onChange(event.target.value as SupportedLocale)}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {getCatalog(code).meta.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
