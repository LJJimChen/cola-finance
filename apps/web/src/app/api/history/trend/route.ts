import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

function resolveTrendStartDate(range: string): Date {
  const now = new Date();
  const start = new Date(now.getTime());
  switch (range) {
    case "1M":
      start.setMonth(start.getMonth() - 1);
      break;
    case "3M":
      start.setMonth(start.getMonth() - 3);
      break;
    case "6M":
      start.setMonth(start.getMonth() - 6);
      break;
    case "1Y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "YTD":
      start.setMonth(0, 1);
      break;
    case "ALL":
      return new Date(0);
  }
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(req.url);
  const range = url.searchParams.get("range") ?? "1M";
  const startDate = resolveTrendStartDate(range);
  const snapshots = await prisma.dailySnapshot.findMany({
    where: { userId, date: { gte: startDate } },
    orderBy: [{ date: "asc" }, { timestamp: "asc" }],
  });
  return NextResponse.json(
    snapshots.map((s) => {
      const raw = String(s.date);
      const date = raw.split("T")[0];
      return {
        date,
        totalValue: Number(s.totalValue),
        dayProfit: Number(s.dayProfit),
        totalProfit: Number(s.totalProfit),
      };
    }),
  );
}

