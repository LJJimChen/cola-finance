import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { NotifyType } from "@cola-finance/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const notif = await prisma.userNotification.findUnique({ where: { id } });
  if (!notif || notif.userId !== userId) {
    return NextResponse.json({ ok: true });
  }
  if (notif.type !== NotifyType.INVITATION) {
    return NextResponse.json({ ok: true });
  }
  const payload = (notif.payload ?? {}) as { groupId?: string };
  const groupId = payload.groupId;
  if (!groupId) {
    return NextResponse.json({ ok: true });
  }
  await prisma.$transaction(async (tx) => {
    await tx.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    });
    await tx.userNotification.update({
      where: { id },
      data: { isRead: true },
    });
  });
  return NextResponse.json({ ok: true });
}
