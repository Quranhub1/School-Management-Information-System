import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('smis.theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smis.theme', theme);
  }, [theme]);

  return (
    <button className="secondary-button" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  );
}
