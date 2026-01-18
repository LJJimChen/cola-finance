import { eq } from 'drizzle-orm';
import type { AppDb } from '../db';
import { sessions, users } from '../db/schema';
import { AppError } from '../lib/errors';
import { nowIsoUtc } from '../lib/time';
import { seedNewUser } from './seed-service';

type PasswordHash = string;

async function hashPassword(password: string): Promise<PasswordHash> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 200_000;
  const hashBytes = await derivePbkdf2Sha256(password, saltBytes, iterations);
  const saltB64 = bytesToBase64(saltBytes);
  const hashB64 = bytesToBase64(hashBytes);
  return `${iterations}:${saltB64}:${hashB64}`;
}

async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 3) {
    return false;
  }

  const iterations = Number(parts[0]);
  const saltBytes = base64ToBytes(parts[1]);
  const storedHash = base64ToBytes(parts[2]);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const derived = await derivePbkdf2Sha256(password, saltBytes, iterations);
  return timingSafeEqual(storedHash, derived);
}

async function derivePbkdf2Sha256(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export type SignupInput = {
  email: string;
  password: string;
  languagePreference?: 'zh' | 'en';
  themeSettings?: 'light' | 'dark' | 'auto';
  displayCurrency?: string;
  timeZone?: string;
};

export type LoginResult = {
  token: string;
};

export class AuthService {
  readonly #db: AppDb;

  constructor(db: AppDb) {
    this.#db = db;
  }

  async signup(input: SignupInput): Promise<{ userId: string }> {
    const now = nowIsoUtc();
    const existing = await this.#db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length > 0) {
      throw new AppError({ status: 409, code: 'CONFLICT', message: 'Email already registered' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);

    await this.#db.insert(users).values({
      id: userId,
      email: input.email,
      passwordHash,
      languagePreference: input.languagePreference ?? 'zh',
      themeSettings: input.themeSettings ?? 'auto',
      displayCurrency: input.displayCurrency ?? 'CNY',
      timeZone: input.timeZone ?? 'Asia/Shanghai',
      createdAt: now,
      updatedAt: now,
    });

    await seedNewUser(this.#db, { userId, now });
    return { userId };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const result = await this.#db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) {
      throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid email or password' });
    }

    const user = result[0];
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid email or password' });
    }

    const token = crypto.randomUUID();
    const now = nowIsoUtc();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await this.#db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      createdAt: now,
      expiresAt,
    });

    return { token };
  }

  async logout(token: string): Promise<void> {
    const deleted = await this.#db.delete(sessions).where(eq(sessions.token, token)).returning();
    if (deleted.length === 0) {
      throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid session token' });
    }
  }
}
