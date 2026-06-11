import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('cissp-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  const toggleTheme = () => {
    console.log('Theme Toggle Clicked');
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      console.log('Theme changed to:', next);
      return next;
    });
  };

  useEffect(() => {
    console.log('Current Theme:', theme);
    localStorage.setItem('cissp-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
