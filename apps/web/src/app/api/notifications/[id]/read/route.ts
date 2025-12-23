import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

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
  await prisma.userNotification.update({
    where: { id },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}
