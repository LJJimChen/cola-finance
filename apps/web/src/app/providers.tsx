"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { useSettingsStore } from "../store/useSettingsStore";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const pathname = usePathname();

  const routeLanguage = (() => {
    const first = pathname.split("/")[1];
    if (first === "en" || first === "zh") {
      return first;
    }
    return null;
  })();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (routeLanguage && routeLanguage !== language) {
      setLanguage(routeLanguage);
    }
  }, [language, routeLanguage, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = routeLanguage ?? language;
  }, [language, routeLanguage]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}
