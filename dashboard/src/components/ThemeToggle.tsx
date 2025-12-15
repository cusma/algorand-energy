import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from './ui/button';

type Theme = 'system' | 'light' | 'dark';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'system';
  });

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['system', 'light', 'dark'];
    const currentIndex = themeOrder.indexOf(theme);
    const newTheme = themeOrder[(currentIndex + 1) % themeOrder.length];

    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case 'system':
        return <Monitor size={18} className="text-foreground" />;
      case 'light':
        return <Sun size={18} className="text-foreground" />;
      case 'dark':
        return <Moon size={18} className="text-foreground" />;
    }
  };

  const getAriaLabel = () => {
    const labels = {
      system: 'System theme',
      light: 'Light theme',
      dark: 'Dark theme',
    };
    return `Current: ${labels[theme]}. Click to toggle theme`;
  };

  return (
    <Button onClick={toggleTheme} variant="outline" size="icon" aria-label={getAriaLabel()}>
      {getIcon()}
    </Button>
  );
};
