/** Simple ICU MessageFormat implementation for basic pluralization and interpolation */

interface ICUPluralRule {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

type ICUValue = string | number | Date | ICUPluralRule

function getPluralCategory(locale: string, n: number): string {
  const formatter = new Intl.PluralRules(locale, { type: 'cardinal' })
  return formatter.select(n)
}

function formatValue(value: ICUValue, locale: string): string {
  if (typeof value === 'number') {
    return new Intl.NumberFormat(locale).format(value)
  }
  if (value instanceof Date) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(value)
  }
  return String(value)
}

function interpolate(message: string, params: Record<string, ICUValue> = {}, locale: string): string {
  return message.replace(/\{(\w+)(?:,([^,}]+))?(?:,([^}]+))?\}/g, (match, key, type, style) => {
    const value = params[key]
    if (value === undefined || value === null) return match
    
    // Handle pluralization: {count, plural, one{...} other{...}}
    if (type === 'plural' && typeof value === 'number') {
      const pluralRule = style as unknown as ICUPluralRule
      const category = getPluralCategory(locale, value)
      const pattern = pluralRule[category as keyof ICUPluralRule] ?? pluralRule.other
      if (pattern) {
        return interpolate(pattern, { ...params, [key]: value }, locale)
      }
    }
    
    // Handle select: {gender, select, male{...} female{...} other{...}}
    if (type === 'select' && typeof value === 'string') {
      const selectRule = style as unknown as Record<string, string>
      const pattern = selectRule[value] ?? selectRule.other
      if (pattern) {
        return interpolate(pattern, params, locale)
      }
    }
    
    // Simple value formatting
    if (type === 'number') {
      return new Intl.NumberFormat(locale, style ? JSON.parse(`{${style}}`) : {}).format(Number(value))
    }
    if (type === 'date') {
      return new Intl.DateTimeFormat(locale, style ? JSON.parse(`{${style}}`) : { dateStyle: 'short' }).format(value instanceof Date ? value : new Date(String(value)))
    }
    
    return formatValue(value, locale)
  })
}

export function formatMessage(message: string, params?: Record<string, ICUValue>, locale = 'en-US'): string {
  if (!params) return message
  return interpolate(message, params, locale)
}

// Example usage:
/*
const messages = {
  'students.count': '{count, plural, one{1 student} other{# students}}',
  'welcome': 'Welcome, {name}!',
  'date': 'Today is {today, date, full}',
  'price': 'Total: {amount, number, style:"currency", currency:"UGX"}',
}

formatMessage(messages['students.count'], { count: 1 }, 'en-US') // "1 student"
formatMessage(messages['students.count'], { count: 5 }, 'en-US') // "5 students"
formatMessage(messages['welcome'], { name: 'John' }) // "Welcome, John!"
*/