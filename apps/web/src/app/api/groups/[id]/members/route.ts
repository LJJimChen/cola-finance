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
    include: { user: { select: { id: true, username: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      username: m.user.username,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  );
}
