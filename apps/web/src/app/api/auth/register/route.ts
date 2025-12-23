import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signToken } from "../../../../lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json();
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");
  if (!username || !password) {
    return NextResponse.json({ error: "USERNAME_PASSWORD_REQUIRED" }, { status: 400 });
  }
  const existing = await prisma.appUser.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 401 });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.appUser.create({
    data: { username, password: hash },
  });
  const token = signToken(user.id);
  const res = NextResponse.json({ token, userId: user.id, username: user.username, kind: "user" });
  res.cookies.set("cola_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

