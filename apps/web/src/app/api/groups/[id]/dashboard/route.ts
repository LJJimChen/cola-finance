import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (!membership) {
    return NextResponse.json(null);
  }
  const members = await prisma.groupMember.findMany({
    where: { groupId: params.id },
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
