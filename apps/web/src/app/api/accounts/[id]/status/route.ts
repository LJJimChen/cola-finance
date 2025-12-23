import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const account = await prisma.platformAccount.findUnique({
    where: { id: params.id },
    select: { status: true, platform: true, name: true, updatedAt: true, userId: true },
  });
  if (!account || account.userId !== userId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const { userId: _userId, ...rest } = account;
  return NextResponse.json(rest);
}
