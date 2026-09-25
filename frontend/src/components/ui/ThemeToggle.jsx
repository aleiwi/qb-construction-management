import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useSimpleTheme } from '../../hooks/qb/useTheme.jsx';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useSimpleTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-10 w-10 items-center justify-center
        rounded-full transition-all duration-300 hover:scale-110
        ${isDark 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-gray-900 shadow-glow-accent' 
          : 'bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-glow'
        }
        ${className}
      `}
      title={isDark ? 'تغيير للوضع النهاري' : 'تغيير للوضع الليلي'}
    >
      <div className="relative">
        {isDark ? (
          <FaSun className="h-5 w-5 transform transition-transform duration-300" />
        ) : (
          <FaMoon className="h-5 w-5 transform transition-transform duration-300" />
        )}
      </div>
      
      {/* تأثير بصري */}
      <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />
    </button>
  );
};

export default ThemeToggle;