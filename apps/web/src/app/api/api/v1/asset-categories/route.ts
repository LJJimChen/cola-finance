import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const items = await prisma.assetCategory.findMany({
    where: { userId },
    orderBy: { symbol: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json();
  const symbol = String(body?.symbol ?? "").trim();
  const category = String(body?.category ?? "").trim();
  if (!symbol || !category) {
    return NextResponse.json({ ok: false });
  }
  await prisma.assetCategory.upsert({
    where: { userId_symbol: { userId, symbol } },
    create: { userId, symbol, category },
    update: { category },
  });
  return NextResponse.json({ ok: true });
}
