import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId } },
  });
  if (!membership) {
    return NextResponse.json(null);
  }
  const members = await prisma.groupMember.findMany({
    where: { groupId: id },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId);
  let totalValue = 0;
  let dayProfit = 0;
  let totalProfit = 0;
  let memberCount = 0;
  for (const uid of userIds) {
    const snapshot = await prisma.dailySnapshot.findFirst({
      where: { userId: uid },
      orderBy: { date: "desc" },
    });
    if (snapshot) {
      totalValue += Number(snapshot.totalValue);
      dayProfit += Number(snapshot.dayProfit);
      totalProfit += Number(snapshot.totalProfit);
      memberCount++;
    }
  }
  return NextResponse.json({ totalValue, dayProfit, totalProfit, memberCount });
}
