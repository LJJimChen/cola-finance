import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const snapshots = await prisma.dailySnapshot.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { timestamp: "desc" }],
    take: 1,
  });
  const snapshot = snapshots[0];
  if (!snapshot) {
    return NextResponse.json({
      totalValue: 0,
      dayProfit: 0,
      totalProfit: 0,
      lastUpdated: null,
    });
  }
  return NextResponse.json({
    totalValue: snapshot.totalValue,
    dayProfit: snapshot.dayProfit,
    totalProfit: snapshot.totalProfit,
    lastUpdated: snapshot.timestamp,
  });
}
