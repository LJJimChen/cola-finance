import { renderHook, act } from '@testing-library/react';
import { useI18n } from '../lib/i18n';

// Mock the atom and useAtom for testing
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn(),
  atom: jest.fn(),
}));

import { useAtom } from 'jotai';

describe('i18n hook', () => {
  beforeEach(() => {
    (useAtom as jest.Mock).mockReturnValue(['en', jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should translate a simple key', () => {
    const { result } = renderHook(() => useI18n());
    
    expect(result.current.t('common.welcome')).toBe('Welcome');
  });

  it('should handle nested translation keys', () => {
    const { result } = renderHook(() => useI18n());
    
    expect(result.current.t('dashboard.title')).toBe('Dashboard');
  });

  it('should return the key if translation is not found', () => {
    const { result } = renderHook(() => useI18n());
    
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('should return supported languages', () => {
    const { result } = renderHook(() => useI18n());
    
    expect(result.current.supportedLanguages).toEqual(['en', 'zh']);
  });
});