import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { encryptCredentials, decryptCredentialsSafe } from "../../../../lib/credentials";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const account = await prisma.platformAccount.findUnique({ where: { id: params.id } });
  if (!account || account.userId !== userId) {
    return NextResponse.json(null);
  }
  const body = await req.json();
  const encryptedCredentials =
    body.credentials === undefined
      ? undefined
      : body.credentials && String(body.credentials).trim()
        ? encryptCredentials(String(body.credentials))
        : null;
  const updated = await prisma.platformAccount.update({
    where: { id: params.id },
    data: {
      platform: body.platform ?? undefined,
      name: body.name ?? undefined,
      credentials: encryptedCredentials,
    },
  });
  return NextResponse.json({
    ...updated,
    credentials: decryptCredentialsSafe(updated.credentials),
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const account = await prisma.platformAccount.findUnique({ where: { id: params.id } });
  if (!account || account.userId !== userId) {
    return NextResponse.json({ ok: true });
  }
  await prisma.assetPosition.deleteMany({ where: { accountId: params.id } });
  await prisma.platformAccount.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
