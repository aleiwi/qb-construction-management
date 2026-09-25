import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: `
      bg-gradient-to-br from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900
      text-white shadow-glow hover:shadow-glow-accent
      border border-primary-500
    `,
    secondary: `
      bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300
      text-gray-800 shadow-md hover:shadow-lg
      border border-gray-300
      dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700
      dark:text-gray-200 dark:border-gray-600
    `,
    accent: `
      bg-gradient-to-br from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800
      text-white shadow-glow-accent
      border border-accent-400
    `,
    success: `
      bg-gradient-to-br from-success-500 to-success-700 hover:from-success-600 hover:to-success-800
      text-white shadow-md hover:shadow-lg
      border border-success-400
    `,
    danger: `
      bg-gradient-to-br from-danger-500 to-danger-700 hover:from-danger-600 hover:to-danger-800
      text-white shadow-md hover:shadow-lg
      border border-danger-400
    `,
    outline: `
      bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20
      text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200
      border-2 border-primary-500 hover:border-primary-600
      shadow-none hover:shadow-md
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm-ar rounded-lg',
    md: 'px-4 py-2 text-base-ar rounded-lg',
    lg: 'px-6 py-3 text-lg-ar rounded-xl',
    xl: 'px-8 py-4 text-xl-ar rounded-xl'
  };

  const baseClasses = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-300 transform
    hover:scale-105 active:scale-95
    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {Icon && !loading && (
        <Icon className={`${children ? 'ml-2' : ''} h-4 w-4`} />
      )}
      {children}
    </motion.button>
  );
};

export default Button;