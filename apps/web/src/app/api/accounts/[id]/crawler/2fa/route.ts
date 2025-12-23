import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { AdapterFactory } from "@cola-finance/platform-adapters";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const account = await prisma.platformAccount.findUnique({ where: { id } });
  if (!account || account.userId !== userId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (account.status === "Connected") {
    return NextResponse.json({ error: "ALREADY_CONNECTED" }, { status: 409 });
  }
  const adapter = AdapterFactory.getAdapter(account.platform);
  if (!adapter.submitChallenge) {
    return NextResponse.json({ error: "NO_2FA" }, { status: 400 });
  }
  const body = await request.json();
  const code = String(body?.code ?? "");
  const sessionId = String(body?.sessionId ?? "");
  const result = await adapter.submitChallenge(sessionId, code);
  if (result.ok) {
    await prisma.platformAccount.update({ where: { id }, data: { status: "Connected" } });
  }
  return NextResponse.json(result);
}
