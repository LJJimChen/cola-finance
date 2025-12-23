import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const account = await prisma.platformAccount.findUnique({
    where: { id },
    select: { status: true, platform: true, name: true, updatedAt: true, userId: true },
  });
  if (!account || account.userId !== userId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const { userId: _userId, ...rest } = account;
  return NextResponse.json(rest);
}
