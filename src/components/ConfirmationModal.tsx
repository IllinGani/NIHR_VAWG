import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const colors = {
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-100',
      icon: 'text-red-600'
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
      icon: 'text-amber-600'
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
      icon: 'text-blue-600'
    }
  };

  const activeColors = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className={`w-16 h-16 ${activeColors.bg} ${activeColors.text} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                {message}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onConfirm();
                    // Only close if not in a loading state
                    if (!confirmText.includes('...')) {
                      onClose();
                    }
                  }}
                  disabled={confirmText.includes('...')}
                  className={`w-full py-3 ${activeColors.button} text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
