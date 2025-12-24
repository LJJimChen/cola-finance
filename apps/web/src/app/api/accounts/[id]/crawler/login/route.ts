import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { AdapterFactory, type FetchAssetsResult } from "@cola-finance/platform-adapters";
import { decodeCredentials } from "@/lib/credentials";
import { AccountStatus } from "@prisma/client";

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
  if (!adapter) {
    return NextResponse.json({ error: "ADAPTER_NOT_FOUND" }, { status: 400 });
  }
  const creds = decodeCredentials(account.credentials);
  const result: FetchAssetsResult = await adapter.fetchAssets(creds);
  if (result.ok) {
    await prisma.platformAccount.update({
      where: { id },
      data: { status: AccountStatus.Connected },
    });
  } else {
    let status: AccountStatus = AccountStatus.Error;
    if (result.reason === "NEED_2FA" || result.reason === "NEED_CAPTCHA") {
      status = AccountStatus.NeedVerify;
    } else if (result.reason === "INVALID_CREDENTIALS") {
      status = AccountStatus.Unauthorized;
    }
    await prisma.platformAccount.update({
      where: { id },
      data: { status },
    });
  }
  return NextResponse.json(result);
}
