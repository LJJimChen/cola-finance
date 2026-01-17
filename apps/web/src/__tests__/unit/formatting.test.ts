import { formatCurrency, formatNumber, formatPercentage, formatDate } from '../utils/formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('formats currency in USD', () => {
      expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
    });

    it('formats currency in CNY', () => {
      expect(formatCurrency(1234.56, 'CNY', 'zh-CN')).toBe('¥1,234.56');
    });

    it('formats currency in EUR', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56\u00A0€');
    });
  });

  describe('formatNumber', () => {
    it('formats number with default options', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });

    it('formats number with custom options', () => {
      expect(formatNumber(1234.567, 'en-US', { maximumFractionDigits: 0 })).toBe('1,235');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentage correctly', () => {
      expect(formatPercentage(15)).toBe('15%');
    });

    it('formats percentage with decimals', () => {
      expect(formatPercentage(12.34)).toBe('12.34%');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-01-15');
      expect(formatDate(date, 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
        .toBe('Jan 15, 2023');
    });
  });
});