import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { GroupRole, NotifyType } from "@cola-finance/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (!membership || membership.role !== GroupRole.OWNER) {
    return NextResponse.json(null);
  }
  const body = await req.json();
  const username = String(body?.username ?? "").trim();
  if (!username) {
    return NextResponse.json(null);
  }
  const target = await prisma.appUser.findUnique({ where: { username } });
  if (!target || target.id === userId) {
    return NextResponse.json(null);
  }
  const group = await prisma.familyGroup.findUnique({ where: { id: params.id } });
  if (!group) {
    return NextResponse.json(null);
  }
  const inviter = await prisma.appUser.findUnique({ where: { id: userId } });
  await prisma.userNotification.create({
    data: {
      userId: target.id,
      type: NotifyType.INVITATION,
      title: `家庭组邀请：${group.name}`,
      content: `${inviter?.username ?? "Someone"} 邀请你加入家庭组「${group.name}」`,
      payload: { groupId: params.id, inviterUserId: userId, inviterUsername: inviter?.username ?? null },
    },
  });
  return NextResponse.json({ ok: true });
}
