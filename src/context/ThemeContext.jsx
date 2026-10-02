import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mcmca-theme';
const DARK = 'dark';

function applyDarkTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', DARK);
  root.style.colorScheme = DARK;
  if (document.body) {
    document.body.style.backgroundColor = '#0B1120';
    document.body.style.colorScheme = DARK;
  }
  try {
    localStorage.setItem(STORAGE_KEY, DARK);
  } catch {
    /* ignore */
  }
}

applyDarkTheme();

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme] = useState(DARK);

  useEffect(() => {
    applyDarkTheme();
  }, []);

  const cycleTheme = () => {
    applyDarkTheme();
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme: () => applyDarkTheme(),
      cycleTheme,
      themeLabel: 'Dark'
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
