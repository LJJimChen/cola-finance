import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit");
  const snapshots = await prisma.dailySnapshot.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { timestamp: "desc" }],
    take: 1,
  });
  const snapshot = snapshots[0];
  if (!snapshot) {
    return NextResponse.json([]);
  }
  const holdings = await prisma.assetPosition.findMany({
    where: { snapshotId: snapshot.id },
    take: limit ? Number(limit) : undefined,
    include: { account: true },
  });
  return NextResponse.json(holdings);
}
