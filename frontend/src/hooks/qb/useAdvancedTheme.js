/**
 * Advanced Dark Mode System
 * نظام الوضع الداكن المتقدم
 */

import React from 'react';

// ═══════════════════════════════════════════════════════
// 1. Theme Context
// ═══════════════════════════════════════════════════════
export const ThemeContext = React.createContext();

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════
// 2. Theme Definitions
// ═══════════════════════════════════════════════════════
export const themes = {
  light: {
    name: 'light',
    colors: {
      bg: '#ffffff',
      bgSecondary: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0ea5e9',
    },
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    name: 'dark',
    colors: {
      bg: '#1a1a1a',
      bgSecondary: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#404040',
      primary: '#60a5fa',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#38bdf8',
    },
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

// ═══════════════════════════════════════════════════════
// 3. High Contrast Theme
// ═══════════════════════════════════════════════════════
export const highContrastTheme = {
  light: {
    name: 'high-contrast-light',
    colors: {
      bg: '#ffffff',
      bgSecondary: '#f0f0f0',
      text: '#000000',
      textSecondary: '#222222',
      border: '#000000',
      primary: '#0000ff',
      success: '#008000',
      warning: '#ff8800',
      error: '#cc0000',
      info: '#0066cc',
    },
  },
  dark: {
    name: 'high-contrast-dark',
    colors: {
      bg: '#000000',
      bgSecondary: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#e0e0e0',
      border: '#ffffff',
      primary: '#ffff00',
      success: '#00ff00',
      warning: '#ffaa00',
      error: '#ff0000',
      info: '#00ffff',
    },
  },
};

// ═══════════════════════════════════════════════════════
// 4. Custom Theme Creator
// ═══════════════════════════════════════════════════════
export const createCustomTheme = (baseTheme, customColors) => {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...customColors,
    },
  };
};

// ═══════════════════════════════════════════════════════
// 5. Theme Provider Component
// ═══════════════════════════════════════════════════════
export const ThemeProvider = ({ children, initialTheme = 'light' }) => {
  // Get saved theme from localStorage or use system preference
  const getSavedTheme = () => {
    const saved = localStorage.getItem('theme-preference');
    if (saved) return saved;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = React.useState(getSavedTheme());
  const [useHighContrast, setUseHighContrast] = React.useState(() =>
    localStorage.getItem('high-contrast') === 'true'
  );

  const currentTheme = useHighContrast
    ? highContrastTheme[theme]
    : themes[theme];

  React.useEffect(() => {
    localStorage.setItem('theme-preference', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;

    // Apply CSS variables
    const colors = currentTheme.colors;
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
  }, [theme, currentTheme]);

  React.useEffect(() => {
    localStorage.setItem('high-contrast', useHighContrast);
  }, [useHighContrast]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleHighContrast = () => {
    setUseHighContrast(prev => !prev);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    currentTheme,
    useHighContrast,
    toggleHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════
// 6. Styled Components Helper
// ═══════════════════════════════════════════════════════
export const useThemedStyles = (styleCreator) => {
  const { currentTheme } = useTheme();
  return React.useMemo(() => styleCreator(currentTheme.colors), [currentTheme]);
};

// ═══════════════════════════════════════════════════════
// 7. Theme Toggle Component
// ═══════════════════════════════════════════════════════
export const ThemeToggle = () => {
  const { theme, toggleTheme, useHighContrast, toggleHighContrast } = useTheme();

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bgSecondary)',
          color: 'var(--color-text)',
          cursor: 'pointer',
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <button
        onClick={toggleHighContrast}
        aria-label={`${useHighContrast ? 'Disable' : 'Enable'} high contrast`}
        title={`${useHighContrast ? 'Disable' : 'Enable'} high contrast`}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-border)',
          backgroundColor: useHighContrast ? 'var(--color-primary)' : 'var(--color-bgSecondary)',
          color: useHighContrast ? '#fff' : 'var(--color-text)',
          cursor: 'pointer',
        }}
      >
        {useHighContrast ? 'HC' : 'Normal'}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// 8. CSS Variables Generator
// ═══════════════════════════════════════════════════════
export const generateThemeCSS = (themeName) => {
  const theme = themes[themeName] || themes.light;
  const colors = theme.colors;

  let css = `:root[data-theme="${themeName}"] {\n`;

  Object.entries(colors).forEach(([key, value]) => {
    css += `  --color-${key}: ${value};\n`;
  });

  css += `  --shadow: ${theme.shadow};\n`;
  css += `}\n`;

  return css;
};

// ═══════════════════════════════════════════════════════
// 9. System Preference Listener
// ═══════════════════════════════════════════════════════
export const useSystemThemePreference = () => {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);
};

// ═══════════════════════════════════════════════════════
// 10. Theme Persistence
// ═══════════════════════════════════════════════════════
export const useThemePersistence = () => {
  const { theme, useHighContrast } = useTheme();

  React.useEffect(() => {
    const preferences = {
      theme,
      highContrast: useHighContrast,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('theme-preferences', JSON.stringify(preferences));
  }, [theme, useHighContrast]);
};

// ═══════════════════════════════════════════════════════
// 11. Color Utilities
// ═══════════════════════════════════════════════════════
export const colorUtils = {
  // Lighten a color
  lighten: (color, amount = 10) => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, (num >> 8 & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return (usePound ? '#' : '') + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  },

  // Darken a color
  darken: (color, amount = 10) => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, (num >> 8 & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return (usePound ? '#' : '') + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  },

  // Convert hex to RGB
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },

  // Convert RGB to hex
  rgbToHex: (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },
};

// ═══════════════════════════════════════════════════════
// 12. Pre-defined Color Schemes
// ═══════════════════════════════════════════════════════
export const colorSchemes = {
  professional: {
    light: createCustomTheme(themes.light, {
      primary: '#1e40af',
      success: '#059669',
    }),
    dark: createCustomTheme(themes.dark, {
      primary: '#3b82f6',
      success: '#10b981',
    }),
  },
  vibrant: {
    light: createCustomTheme(themes.light, {
      primary: '#dc2626',
      success: '#ea580c',
    }),
    dark: createCustomTheme(themes.dark, {
      primary: '#f87171',
      success: '#fb923c',
    }),
  },
  calm: {
    light: createCustomTheme(themes.light, {
      primary: '#2563eb',
      success: '#0891b2',
    }),
    dark: createCustomTheme(themes.dark, {
      primary: '#60a5fa',
      success: '#06b6d4',
    }),
  },
};

// ═══════════════════════════════════════════════════════
// 13. Reduced Motion Support
// ═══════════════════════════════════════════════════════
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

export default {
  ThemeContext,
  useTheme,
  themes,
  highContrastTheme,
  createCustomTheme,
  ThemeProvider,
  useThemedStyles,
  ThemeToggle,
  generateThemeCSS,
  useSystemThemePreference,
  useThemePersistence,
  colorUtils,
  colorSchemes,
  useReducedMotion,
};
