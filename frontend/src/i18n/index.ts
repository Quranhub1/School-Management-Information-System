import { formatMessage } from './icu'

const translations: Record<string, Record<string, string>> = {};
const localeConfigs: Record<string, LocaleConfig> = {
  en: { direction: 'ltr', locale: 'en-US', currency: 'UGX', dateFormat: 'short' },
  sw: { direction: 'ltr', locale: 'sw-KE', currency: 'UGX', dateFormat: 'short' },
  ar: { direction: 'rtl', locale: 'ar-SA', currency: 'UGX', dateFormat: 'short' },
}

export interface LocaleConfig {
  direction: 'ltr' | 'rtl'
  locale: string
  currency: string
  dateFormat: 'short' | 'medium' | 'long' | 'full'
}

let currentLocale = 'en'

export async function loadTranslations(locale: string): Promise<void> {
  try {
    const mod = await import(`./${locale}.json`)
    translations[locale] = mod.default ?? mod
  } catch {
    translations[locale] = {}
  }
}

export function t(
  key: string, 
  params?: Record<string, string | number | Date>, 
  locale = currentLocale
): string {
  const keys = key.split('.')
  let current: any = translations[locale] ?? {}
  for (const k of keys) { current = current?.[k] }
  
  if (typeof current === 'string') {
    return formatMessage(current, params)
  }
  
  return params ? formatMessage(key, params) : key
}

export function getLocale(): string {
  return currentLocale
}

export function setLocale(locale: string): void {
  currentLocale = locale
  localStorage.setItem('smis.locale', locale)
  applyDirection(locale)
}

export function getLocaleConfig(locale?: string): LocaleConfig {
  return localeConfigs[locale ?? currentLocale] ?? localeConfigs.en
}

export function getDirection(locale?: string): 'ltr' | 'rtl' {
  return getLocaleConfig(locale).direction
}

export function applyDirection(locale?: string): void {
  const dir = getDirection(locale)
  document.documentElement.dir = dir
  document.documentElement.lang = getLocaleConfig(locale).locale
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions, locale?: string): string {
  const config = getLocaleConfig(locale)
  return new Intl.NumberFormat(config.locale, options).format(value)
}

export function formatCurrency(value: number, currency?: string, locale?: string): string {
  const config = getLocaleConfig(locale)
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency ?? config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: Date | string, options?: Intl.DateTimeFormatOptions, locale?: string): string {
  const config = getLocaleConfig(locale)
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(config.locale, options ?? { 
    dateStyle: config.dateFormat 
  }).format(date)
}

export function formatRelativeTime(value: Date | string, locale?: string): string {
  const config = getLocaleConfig(locale)
  const date = typeof value === 'string' ? new Date(value) : value
  const rtf = new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' })
  const diffMs = date.getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, 'day')
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, 'hour')
  return rtf.format(diffMinutes, 'minute')
}

// Initialize direction on load
if (typeof window !== 'undefined') {
  const savedLocale = localStorage.getItem('smis.locale') || 'en'
  currentLocale = savedLocale
  applyDirection(savedLocale)
}
