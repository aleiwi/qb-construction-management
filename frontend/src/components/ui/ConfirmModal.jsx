// ConfirmModal.jsx — reusable confirmation modal (dark themed)
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({
  open, title = 'تأكيد الإجراء', message, confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء', onConfirm, onClose, danger = true, loading = false,
}) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
          <div className="flex gap-3 p-5 pt-2 border-t border-slate-800">
            <button onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-sm font-semibold transition">
              {cancelLabel}
            </button>
            <button onClick={onConfirm} disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'جارٍ...' : confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmModal;