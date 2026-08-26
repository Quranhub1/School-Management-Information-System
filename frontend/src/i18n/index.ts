const translations: Record<string, Record<string, string>> = {};

export async function loadTranslations(locale: string) {
  try {
    const mod = await import(`./${locale}.json`);
    translations[locale] = mod.default ?? mod;
  } catch {
    translations[locale] = {};
  }
}

export function t(locale: string, key: string, fallback = ''): string {
  const keys = key.split('.');
  let current: any = translations[locale] ?? {};
  for (const k of keys) { current = current?.[k]; }
  return current ?? fallback ?? key;
}

export function getLocale(): string {
  return localStorage.getItem('smis.locale') || 'en';
}

export function setLocale(locale: string) {
  localStorage.setItem('smis.locale', locale);
}
