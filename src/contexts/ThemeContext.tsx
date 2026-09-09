import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';
export type ColorPreset = 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber' | 'custom';

interface ColorConfig {
  primary: string; // HSL "199 100% 50%"
  secondary: string;
}

const PRESETS: Record<Exclude<ColorPreset, 'custom'>, ColorConfig> = {
  cyan: { primary: '199 100% 50%', secondary: '270 60% 55%' },
  purple: { primary: '270 80% 60%', secondary: '320 70% 55%' },
  emerald: { primary: '160 80% 45%', secondary: '199 90% 50%' },
  rose: { primary: '340 85% 58%', secondary: '20 90% 55%' },
  amber: { primary: '38 95% 55%', secondary: '15 85% 55%' },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  colorPreset: ColorPreset;
  setColorPreset: (p: ColorPreset) => void;
  customPrimary: string;
  setCustomPrimary: (h: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('ku_theme') as Theme) || 'dark');
  const [colorPreset, setColorPresetState] = useState<ColorPreset>(() => (localStorage.getItem('ku_color') as ColorPreset) || 'cyan');
  const [customPrimary, setCustomPrimaryState] = useState<string>(() => localStorage.getItem('ku_custom') || '199 100% 50%');

  useEffect(() => {
    localStorage.setItem('ku_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ku_color', colorPreset);
    const cfg = colorPreset === 'custom'
      ? { primary: customPrimary, secondary: customPrimary }
      : PRESETS[colorPreset];
    const root = document.documentElement;
    root.style.setProperty('--primary', cfg.primary);
    root.style.setProperty('--secondary', cfg.secondary);
    root.style.setProperty('--accent', cfg.primary);
    root.style.setProperty('--ring', cfg.primary);
    root.style.setProperty('--sidebar-primary', cfg.primary);
    root.style.setProperty('--sidebar-ring', cfg.primary);
    root.style.setProperty('--neon-blue', cfg.primary);
    root.style.setProperty('--neon-purple', cfg.secondary);
  }, [colorPreset, customPrimary]);

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme: () => setThemeState(t => t === 'dark' ? 'light' : 'dark'),
      setTheme: setThemeState,
      colorPreset,
      setColorPreset: (p) => { setColorPresetState(p); },
      customPrimary,
      setCustomPrimary: (h) => { setCustomPrimaryState(h); localStorage.setItem('ku_custom', h); },
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
