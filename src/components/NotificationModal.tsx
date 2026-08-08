import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface NotificationState {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface NotificationModalProps {
  notification: NotificationState | null;
  onClose: () => void;
}

export function NotificationModal({ notification, onClose }: NotificationModalProps) {
  useEffect(() => {
    if (notification?.isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification || !notification.isOpen) return null;

  const isSuccess = notification.type === 'success';
  const isMobileOrTablet = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: isMobileOrTablet ? '100%' : 15, scale: isMobileOrTablet ? 1 : 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobileOrTablet ? '100%' : 15, scale: isMobileOrTablet ? 1 : 0.94 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-t-3xl md:rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 z-10 overflow-hidden"
        >
          {/* Top Decorative Color Accent */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isSuccess ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
            }`}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Status Icon */}
          <div className="pt-2 flex justify-center">
            {isSuccess ? (
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-900/60 shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Content Text */}
          <div className="space-y-1">
            <h3 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight">
              {notification.title || (isSuccess ? 'Berhasil' : 'Gagal')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className={`w-full py-2.5 px-4 font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              OK
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
