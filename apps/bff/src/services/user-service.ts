import type { AppDb } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface UserProfile {
  id: string;
  email: string;
  languagePreference: string | null;
  themeSettings: string | null;
  displayCurrency: string | null;
  timeZone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileData {
  languagePreference?: 'zh' | 'en';
  themeSettings?: 'light' | 'dark' | 'auto';
  displayCurrency?: string;
  timeZone?: string;
}

export interface UserService {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, data: UpdateUserProfileData): Promise<UserProfile | null>;
}

export class UserServiceImpl implements UserService {
  constructor(private db: AppDb) {}

  private mapRowToProfile(row: typeof user.$inferSelect): UserProfile {
    return {
      id: row.id,
      email: row.email,
      languagePreference: row.languagePreference,
      themeSettings: row.themeSettings,
      displayCurrency: row.displayCurrency,
      timeZone: row.timeZone,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToProfile(result[0]);
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileData): Promise<UserProfile | null> {
    const updated = await this.db
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();

    if (updated.length === 0) {
      return null;
    }

    return this.mapRowToProfile(updated[0]);
  }
}
