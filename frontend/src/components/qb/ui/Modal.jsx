import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  type = 'default',
  showCloseButton = true
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  const typeStyles = {
    default: 'border-gray-200 dark:border-gray-700',
    success: 'border-success-200 dark:border-success-700',
    warning: 'border-warning-200 dark:border-warning-700',
    error: 'border-danger-200 dark:border-danger-700',
    info: 'border-primary-200 dark:border-primary-700'
  };

  const typeIcons = {
    success: FaCheck,
    warning: FaExclamationTriangle,
    error: FaTimes,
    info: FaInfoCircle
  };

  const TypeIcon = typeIcons[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* خلفية داكنة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* المحتوى */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`
                relative w-full ${sizes[size]} transform overflow-hidden 
                rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all
                border-2 ${typeStyles[type]}
              `}
            >
              {/* رأس المودال */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {TypeIcon && (
                      <TypeIcon className={`h-6 w-6 ${
                        type === 'success' ? 'text-success-500' :
                        type === 'warning' ? 'text-warning-500' :
                        type === 'error' ? 'text-danger-500' :
                        type === 'info' ? 'text-primary-500' :
                        'text-gray-500'
                      }`} />
                    )}
                    {title && (
                      <h3 className="text-lg-ar font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </h3>
                    )}
                  </div>
                  
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
              
              {/* المحتوى */}
              <div className="px-6 py-4">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;