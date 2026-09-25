import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  gradient = false,
  ...props 
}) => {
  const baseClasses = `
    relative overflow-hidden rounded-xl transition-all duration-300
    ${hover ? 'hover:shadow-card-hover hover:-translate-y-1' : ''}
    ${glow ? 'shadow-glow' : 'shadow-card'}
    ${gradient 
      ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' 
      : 'bg-white dark:bg-gray-800'
    }
    border border-gray-200 dark:border-gray-700
    ${className}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={baseClasses}
      {...props}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 dark:from-primary-400/10 dark:to-accent-400/10" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default Card;