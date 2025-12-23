import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { NotifyType } from "@cola-finance/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const notif = await prisma.userNotification.findUnique({ where: { id: params.id } });
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
      where: { id: params.id },
      data: { isRead: true },
    });
  });
  return NextResponse.json({ ok: true });
}
