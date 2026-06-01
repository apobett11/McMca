import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mcmca-theme';
const THEMES = ['dark', 'light'];

function normalizeTheme(saved) {
  if (saved === 'neon') return 'dark';
  return THEMES.includes(saved) ? saved : 'dark';
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return normalizeTheme(saved);
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const cycleTheme = () => {
    setThemeState((current) => {
      const idx = THEMES.indexOf(current);
      return THEMES[(idx + 1) % THEMES.length];
    });
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      cycleTheme,
      themeLabel: theme.charAt(0).toUpperCase() + theme.slice(1)
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
