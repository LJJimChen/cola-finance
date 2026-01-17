/**
 * Utility functions for number and currency formatting based on locale
 */

export const formatNumber = (value: number, locale: string = 'en-US', options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
};

export const formatCurrency = (value: number, currency: string = 'USD', locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number, locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatDate = (date: Date, locale: string = 'en-US', options: Intl.DateTimeFormatOptions = {}): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
};

// Specific formatters for Chinese locale
export const formatNumberZh = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return formatNumber(value, 'zh-CN', options);
};

export const formatCurrencyZh = (value: number, currency: string = 'CNY'): string => {
  return formatCurrency(value, currency, 'zh-CN');
};

export const formatPercentageZh = (value: number): string => {
  return formatPercentage(value, 'zh-CN');
};

export const formatDateZh = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
  return formatDate(date, 'zh-CN', options);
};

// Specific formatters for English locale
export const formatNumberEn = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return formatNumber(value, 'en-US', options);
};

export const formatCurrencyEn = (value: number, currency: string = 'USD'): string => {
  return formatCurrency(value, currency, 'en-US');
};

export const formatPercentageEn = (value: number): string => {
  return formatPercentage(value, 'en-US');
};

export const formatDateEn = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
  return formatDate(date, 'en-US', options);
};