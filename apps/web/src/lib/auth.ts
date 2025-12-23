import jwt from "jsonwebtoken";

type JwtPayload = {
  sub: string;
  kind: string;
  exp?: number;
};

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function signToken(userId: string) {
  return jwt.sign({ sub: userId, kind: "user" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(req: Request): string | null {
  const userId = req.headers.get("x-cola-user-id");
  if (!userId) {
    return null;
  }
  return userId;
}
