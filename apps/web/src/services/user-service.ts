import { getApiClient } from '@repo/shared-types';
import type { User } from '@repo/shared-types';

export interface UserService {
  getCurrentUser(): Promise<User | null>;
  updateUserLanguage(language: 'en' | 'zh'): Promise<User>;
  getStoredLanguagePreference(): 'en' | 'zh' | null;
  setStoredLanguagePreference(language: 'en' | 'zh'): void;
}

export class UserServiceImpl implements UserService {
  private apiClient = getApiClient();

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.apiClient.getUserProfile();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async updateUserLanguage(language: 'en' | 'zh'): Promise<User> {
    // Update user profile via API
    const updatedUser = await this.apiClient.updateUserProfile({
      languagePreference: language
    });

    // Also store locally for immediate UI updates
    this.setStoredLanguagePreference(language);

    return updatedUser;
  }

  getStoredLanguagePreference(): 'en' | 'zh' | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language-preference');
      if (stored === 'en' || stored === 'zh') {
        return stored;
      }
    }
    return null;
  }

  setStoredLanguagePreference(language: 'en' | 'zh'): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language-preference', language);
    }
  }
}

// Create a singleton instance
const userService = new UserServiceImpl();

export { userService };