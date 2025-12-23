import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { encryptCredentials, decryptCredentialsSafe } from "../../../lib/credentials";
import type { PlatformType } from "@cola-finance/db";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const accounts = await prisma.platformAccount.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(
    accounts.map((a) => ({
      ...a,
      credentials: decryptCredentialsSafe(a.credentials),
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
  const platform = (body?.platform ?? "OTHER") as PlatformType;
  const credText = body?.credentials && String(body.credentials).trim();
  const encryptedCredentials = credText ? encryptCredentials(String(body.credentials)) : null;
  const account = await prisma.platformAccount.create({
    data: {
      userId,
      platform,
      name,
      credentials: encryptedCredentials,
      status: "Connected",
    },
  });
  return NextResponse.json(account);
}
