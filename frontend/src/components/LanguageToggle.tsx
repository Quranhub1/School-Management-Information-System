import { useEffect, useState } from 'react';
import { getLocale, setLocale, loadTranslations } from '../i18n';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
];

export function LanguageToggle() {
  const [locale, setLocaleState] = useState(getLocale());

  useEffect(() => { void loadTranslations(locale) }, [locale]);

  function change(code: string) { setLocale(code); setLocaleState(code); }

  return (
    <select value={locale} onChange={e => change(e.target.value)} aria-label="Select language" style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e7e5e4', background: 'white', color: '#1c1917', fontSize: '.82rem', fontWeight: 700 }}>
      {LOCALES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}
