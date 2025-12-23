import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { GroupRole } from "@cola-finance/db";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
    orderBy: { joinedAt: "desc" },
  });
  return NextResponse.json(
    memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      creatorId: m.group.creatorId,
      createdAt: m.group.createdAt,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  );
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
  }
  const created = await prisma.familyGroup.create({
    data: {
      name,
      creatorId: userId,
      members: {
        create: {
          userId,
          role: GroupRole.OWNER,
        },
      },
    },
    include: {
      members: {
        where: { userId },
      },
    },
  });
  const membership = created.members[0];
  return NextResponse.json({
    id: created.id,
    name: created.name,
    creatorId: created.creatorId,
    createdAt: created.createdAt,
    role: membership?.role ?? GroupRole.MEMBER,
  });
}
