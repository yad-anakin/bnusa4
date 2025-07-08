import { useEffect, useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ type, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto dismiss toast after duration
  useEffect(() => {
    if (!duration) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  // Determine icon and color based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-400',
          textColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: <ExclamationCircleIcon className="h-6 w-6 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-400',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-400',
          textColor: 'text-yellow-800'
        };
      case 'info':
      default:
        return {
          icon: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-400',
          textColor: 'text-blue-800'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${styles.bgColor} border-l-4 ${styles.borderColor} p-4 rounded shadow-lg max-w-md`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {styles.icon}
          </div>
          <div className="flex-1">
            <p className={`text-sm ${styles.textColor}`}>{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 