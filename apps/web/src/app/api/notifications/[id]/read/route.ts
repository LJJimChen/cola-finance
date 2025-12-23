import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const notif = await prisma.userNotification.findUnique({ where: { id: params.id } });
  if (!notif || notif.userId !== userId) {
    return NextResponse.json({ ok: true });
  }
  await prisma.userNotification.update({
    where: { id: params.id },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}
