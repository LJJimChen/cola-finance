import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const snapshot = await prisma.dailySnapshot.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
    include: { holdings: true },
  });
  if (!snapshot) {
    return NextResponse.json({ totalValue: 0, categories: [] });
  }
  const totalValue = Number(snapshot.totalValue);
  if (totalValue === 0) {
    return NextResponse.json({ totalValue: 0, categories: [] });
  }
  const mappings = await prisma.assetCategory.findMany({ where: { userId } });
  const symbolToCategory = new Map<string, string>();
  for (const m of mappings) {
    symbolToCategory.set(m.symbol, m.category);
  }
  const currentMap = new Map<string, number>();
  for (const h of snapshot.holdings) {
    const cat = symbolToCategory.get(h.symbol) || "Unclassified";
    const val = currentMap.get(cat) || 0;
    currentMap.set(cat, val + Number(h.marketValue));
  }
  const targets = await prisma.allocationConfig.findMany({ where: { userId } });
  const targetMap = new Map<string, number>();
  for (const t of targets) {
    targetMap.set(t.category, Number(t.percentage));
  }
  const allCats = new Set([...currentMap.keys(), ...targetMap.keys()]);
  const result: {
    category: string;
    currentAmount: number;
    currentPercent: number;
    targetPercent: number;
    targetAmount: number;
    diffAmount: number;
    action: "BUY" | "SELL" | "HOLD";
  }[] = [];
  for (const cat of allCats) {
    const currentAmount = currentMap.get(cat) || 0;
    const currentPercent = (currentAmount / totalValue) * 100;
    const targetPercent = targetMap.get(cat) || 0;
    const targetAmount = (targetPercent / 100) * totalValue;
    const diffAmount = targetAmount - currentAmount;
    result.push({
      category: cat,
      currentAmount,
      currentPercent,
      targetPercent,
      targetAmount,
      diffAmount,
      action: diffAmount > 0 ? "BUY" : diffAmount < 0 ? "SELL" : "HOLD",
    });
  }
  return NextResponse.json({
    totalValue,
    categories: result.sort((a, b) => b.currentPercent - a.currentPercent),
  });
}
