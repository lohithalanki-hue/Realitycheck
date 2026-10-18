import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle className="h-4 w-4 text-white shrink-0" />,
          warning: <AlertTriangle className="h-4 w-4 text-white shrink-0" />,
          error: <AlertCircle className="h-4 w-4 text-white shrink-0" />,
          info: <Info className="h-4 w-4 text-zinc-300 shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="crystal-panel pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/20 bg-black/90 p-3.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-slide-up"
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-white">{toast.title}</div>
              {toast.description && (
                <div className="mt-0.5 text-[11px] text-zinc-300 leading-snug">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-zinc-400 hover:text-white p-0.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
