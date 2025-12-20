"use client";

import { usePathname } from "next/navigation";
import { useMessages } from "next-intl";
import { useCallback } from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import { en } from "../i18n/en";
import { zh } from "../i18n/zh";

const locales = { en, zh };

export function useTranslation() {
  const pathname = usePathname();
  const messages = useMessages();
  const storedLanguage = useSettingsStore((state) => state.language);

  const routeLanguage = (() => {
    const first = pathname.split("/")[1];
    if (first === "en" || first === "zh") {
      return first;
    }
    return null;
  })();

  const language = routeLanguage ?? storedLanguage;
  const t = (messages as typeof en) ?? locales[language] ?? locales.en;

  const href = useCallback(
    (path: string) => {
      if (!path.startsWith("/")) {
        return path;
      }
      if (path === "/") {
        return `/${language}`;
      }
      if (path.startsWith("/en/") || path === "/en" || path.startsWith("/zh/") || path === "/zh") {
        return path;
      }
      return `/${language}${path}`;
    },
    [language]
  );

  return { t, language, href };
}
