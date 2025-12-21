"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useTranslation } from "../../hooks/useTranslation";
import clsx from "clsx";
import { Edit3, LayoutGrid, List, Search } from "lucide-react";

type Holding = {
  id: string;
  symbol: string;
  name?: string;
  quantity: string | number;
  price: string | number;
  costPrice: string | number;
  marketValue: string | number;
  dayProfit: string | number;
  account: {
    id: string;
    platform: string;
    name: string;
  };
};

type AssetCategory = {
  symbol: string;
  category: string;
};

export default function PortfolioPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const { t, href } = useTranslation();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [groupMode, setGroupMode] = useState<"platform" | "category">("platform");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");

  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace(href("/login"));
      return;
    }
  }, [href, router, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      if (cancelled) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [nextHoldings, nextCategories] = await Promise.all([
          fetch(`${apiBase}/api/v1/assets`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => {
            if (!res.ok) {
              throw new Error("LOAD_HOLDINGS_FAILED");
            }
            return res.json();
          }),
          fetch(`${apiBase}/api/v1/asset-categories`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => {
            if (!res.ok) {
              return [];
            }
            return res.json();
          }),
        ]);
        if (cancelled) {
          return;
        }
        setHoldings(Array.isArray(nextHoldings) ? (nextHoldings as Holding[]) : []);
        const map: Record<string, string> = {};
        if (Array.isArray(nextCategories)) {
          for (const c of nextCategories as AssetCategory[]) {
            if (c?.symbol && c?.category) {
              map[c.symbol] = c.category;
            }
          }
        }
        setCategoryMap(map);
      } catch {
        if (!cancelled) {
          setError(t.common.loading);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    const timer = setTimeout(() => {
      void run();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [apiBase, t.common.loading, token]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    for (const h of holdings) {
      if (h.account?.platform) {
        set.add(h.account.platform);
      }
    }
    return Array.from(set).sort();
  }, [holdings]);

  const filteredHoldings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return holdings
      .filter((h) => {
        if (platformFilter !== "ALL" && h.account?.platform !== platformFilter) {
          return false;
        }
        if (!q) {
          return true;
        }
        const hay = `${h.symbol} ${h.account?.platform ?? ""} ${h.account?.name ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => Number(b.marketValue) - Number(a.marketValue));
  }, [holdings, platformFilter, search]);

  const grouped = useMemo(() => {
    if (groupMode === "platform") {
      const platformMap = new Map<string, Map<string, Holding[]>>();
      for (const h of filteredHoldings) {
        const platform = h.account?.platform ?? "UNKNOWN";
        const accountName = h.account?.name ?? "Account";
        const accMap = platformMap.get(platform) ?? new Map<string, Holding[]>();
        const list = accMap.get(accountName) ?? [];
        list.push(h);
        accMap.set(accountName, list);
        platformMap.set(platform, accMap);
      }
      return {
        kind: "platform" as const,
        platforms: Array.from(platformMap.entries()).map(([platform, accounts]) => ({
          platform,
          accounts: Array.from(accounts.entries()).map(([accountName, items]) => ({
            accountName,
            items,
          })),
        })),
      };
    }

    const categoryToSymbols = new Map<string, Map<string, Holding[]>>();
    for (const h of filteredHoldings) {
      const category = categoryMap[h.symbol] ?? t.portfolio.unclassified;
      const symbolMap = categoryToSymbols.get(category) ?? new Map<string, Holding[]>();
      const list = symbolMap.get(h.symbol) ?? [];
      list.push(h);
      symbolMap.set(h.symbol, list);
      categoryToSymbols.set(category, symbolMap);
    }
    return {
      kind: "category" as const,
      categories: Array.from(categoryToSymbols.entries()).map(([category, symbols]) => ({
        category,
        symbols: Array.from(symbols.entries()).map(([symbol, items]) => ({
          symbol,
          name: items[0]?.name,
          items,
          marketValue: items.reduce((sum, it) => sum + Number(it.marketValue), 0),
          dayProfit: items.reduce((sum, it) => sum + Number(it.dayProfit), 0),
          totalProfit: items.reduce((sum, it) => sum + (Number(it.marketValue) - Number(it.costPrice) * Number(it.quantity)), 0),
        })),
      })),
    };
  }, [categoryMap, filteredHoldings, groupMode, t.portfolio.unclassified]);

  const openEdit = (symbol: string) => {
    setEditingSymbol(symbol);
    setEditingCategory(categoryMap[symbol] ?? "");
  };

  const saveCategory = async () => {
    if (!token || !editingSymbol) {
      return;
    }
    const symbol = editingSymbol;
    const category = editingCategory.trim();
    if (!category) {
      return;
    }
    const res = await fetch(`${apiBase}/api/v1/asset-categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol, category }),
    });
    if (res.ok) {
      setCategoryMap((prev) => ({ ...prev, [symbol]: category }));
      setEditingSymbol(null);
      setEditingCategory("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--card-foreground)]">{t.portfolio.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{t.portfolio.description}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              className="w-full bg-transparent text-sm text-[var(--card-foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              placeholder={t.common.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <select
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="ALL">{t.portfolio.filter_all}</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="flex shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={clsx(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  viewMode === "list"
                    ? "bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
                )}
                aria-label={t.portfolio.view_list}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={clsx(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  viewMode === "cards"
                    ? "bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
                )}
                aria-label={t.portfolio.view_cards}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <div className="flex shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-1">
              <button
                type="button"
                onClick={() => setGroupMode("platform")}
                className={clsx(
                  "px-3 py-2 text-xs font-medium rounded-xl transition-colors",
                  groupMode === "platform"
                    ? "bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
                )}
              >
                {t.portfolio.group_platform}
              </button>
              <button
                type="button"
                onClick={() => setGroupMode("category")}
                className={clsx(
                  "px-3 py-2 text-xs font-medium rounded-xl transition-colors",
                  groupMode === "category"
                    ? "bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
                )}
              >
                {t.portfolio.group_category}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-[var(--card-foreground)]">{t.portfolio.holdings}</div>
          <div className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
            {loading ? t.common.loading : `${filteredHoldings.length}`}
          </div>
        </div>

        {error && <div className="mt-3 text-xs text-red-500">{error}</div>}

        {!loading && filteredHoldings.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            {t.portfolio.no_holdings}
          </div>
        )}

        {viewMode === "list" && groupMode === "platform" && grouped.kind === "platform" && (
          <div className="mt-4 space-y-5">
            {grouped.platforms.map((p) => (
              <div key={p.platform} className="space-y-3">
                {p.accounts.map((a) => (
                  <div key={a.accountName} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-[var(--card-foreground)]">{p.platform}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">{a.accountName}</div>
                    </div>
                    <div className="grid gap-2">
                      {a.items.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-base font-medium text-[var(--card-foreground)]">
                                {h.name || h.symbol}
                              </div>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              {h.name && <span className="text-xs text-[var(--muted-foreground)]">{h.symbol}</span>}
                              <button
                                type="button"
                                onClick={() => openEdit(h.symbol)}
                                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                              >
                                <Edit3 className="h-3 w-3" />
                                {categoryMap[h.symbol] ?? t.portfolio.unclassified}
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-sm font-medium text-[var(--card-foreground)]">
                              {Number(h.marketValue).toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={clsx(Number(h.dayProfit) >= 0 ? "text-emerald-600" : "text-red-500")}>
                                {Number(h.dayProfit) > 0 ? "+" : ""}
                                {Number(h.dayProfit).toFixed(2)}
                              </span>
                              <span className="text-[var(--border)]">|</span>
                              <span className={clsx((Number(h.marketValue) - (Number(h.costPrice) * Number(h.quantity))) >= 0 ? "text-emerald-600" : "text-red-500")}>
                                {(Number(h.marketValue) - (Number(h.costPrice) * Number(h.quantity))) > 0 ? "+" : ""}
                                {(Number(h.marketValue) - (Number(h.costPrice) * Number(h.quantity))).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {viewMode === "list" && groupMode === "category" && grouped.kind === "category" && (
          <div className="mt-4 space-y-5">
            {grouped.categories.map((c) => (
              <div key={c.category} className="space-y-2">
                <div className="text-xs font-medium text-[var(--muted-foreground)]">{c.category}</div>
                <div className="grid gap-2">
                  {c.symbols.map((s) => (
                    <div
                      key={s.symbol}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-base font-medium text-[var(--card-foreground)]">
                            {s.name || s.symbol}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {s.name && <span className="text-xs text-[var(--muted-foreground)]">{s.symbol}</span>}
                          <button
                            type="button"
                            onClick={() => openEdit(s.symbol)}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                          >
                            <Edit3 className="h-3 w-3" />
                            {categoryMap[s.symbol] ?? t.portfolio.unclassified}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-medium text-[var(--card-foreground)]">
                          {s.marketValue.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={clsx(s.dayProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {s.dayProfit > 0 ? "+" : ""}
                            {s.dayProfit.toFixed(2)}
                          </span>
                          <span className="text-[var(--border)]">|</span>
                          <span className={clsx(s.totalProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {s.totalProfit > 0 ? "+" : ""}
                            {s.totalProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "cards" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHoldings.map((h) => (
              <div key={h.id} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--card-foreground)]">
                    {h.name ? (
                      <>
                        {h.name} <span className="ml-1 text-xs font-normal text-[var(--muted-foreground)]">{h.symbol}</span>
                      </>
                    ) : (
                      h.symbol
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={clsx("text-sm font-medium", Number(h.dayProfit) >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {Number(h.dayProfit) > 0 ? "+" : ""}
                      {Number(h.dayProfit).toFixed(2)}
                    </div>
                    <div className={clsx("text-xs", (Number(h.marketValue) - (Number(h.costPrice) * Number(h.quantity))) >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {(Number(h.marketValue) - (Number(h.costPrice) * Number(h.quantity))) > 0 ? "+" : ""}
                      {(Number(h.marketValue) - (Number(h.costPrice) * Number(h.quantity))).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                  {h.symbol} · {h.account?.platform} · {h.account?.name}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.portfolio.market_value}</div>
                  <div className="text-sm text-[var(--card-foreground)]">{Number(h.marketValue).toFixed(2)}</div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(h.symbol)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  >
                    <Edit3 className="h-3 w-3" />
                    {categoryMap[h.symbol] ?? t.portfolio.unclassified}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--card-foreground)]">
                {t.portfolio.edit_category}: {editingSymbol}
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                onClick={() => {
                  setEditingSymbol(null);
                  setEditingCategory("");
                }}
              >
                {t.common.cancel}
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              <label className="text-xs text-[var(--muted-foreground)]">{t.portfolio.category}</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
                value={editingCategory}
                onChange={(e) => setEditingCategory(e.target.value)}
                placeholder={t.portfolio.unclassified}
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={!editingCategory.trim()}
                onClick={() => void saveCategory()}
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
