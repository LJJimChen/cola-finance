import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json();
  const targets = Array.isArray(body?.targets) ? body.targets : [];
  await prisma.$transaction(async (tx) => {
    await tx.allocationConfig.deleteMany({ where: { userId } });
    if (targets.length > 0) {
      await tx.allocationConfig.createMany({
        data: targets.map((t: { category: string; percentage: number }) => ({
          userId,
          category: t.category,
          percentage: t.percentage,
        })),
      });
    }
  });
  return NextResponse.json({ ok: true });
}

