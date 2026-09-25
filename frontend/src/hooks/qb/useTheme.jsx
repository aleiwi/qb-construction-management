import { useState, useEffect, createContext, useContext } from 'react';

// إنشاء سياق الثيم
const ThemeContext = createContext();

// خطاف بسيط للثيم
export function useSimpleTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('qb-theme') || 'light';
    setTheme(savedTheme);
    
    const root = window.document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('qb-theme', newTheme);
    
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}