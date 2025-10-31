import { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      default:
        return 'bg-gradient-to-r from-green-500 to-green-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
      default:
        return <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
    }
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return { bgColor: 'bg-green-600', icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> };
      case 'error':
        return { bgColor: 'bg-red-500', icon: <XCircle className="w-4 h-4 flex-shrink-0" /> };
      case 'warning':
        return { bgColor: 'bg-yellow-500', icon: <AlertCircle className="w-4 h-4 flex-shrink-0" /> };
      default:
        return { bgColor: 'bg-green-600', icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> };
    }
  };

  const { bgColor, icon } = getToastStyles();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
      <div className={`${bgColor} text-white rounded-lg shadow-xl max-w-sm mx-4 overflow-hidden`}>
        <div className="flex items-center gap-2 px-3 py-2">
          {icon}
          <p className="flex-1 text-sm font-medium whitespace-nowrap truncate">
            {message}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
