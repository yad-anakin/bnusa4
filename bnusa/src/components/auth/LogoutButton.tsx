import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LogoutButtonProps {
  variant?: 'primary' | 'outline' | 'sidebar' | 'text';
  className?: string;
  showIcon?: boolean;
  showConfirmation?: boolean;
  onLogoutSuccess?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'primary',
  className = '',
  showIcon = true,
  showConfirmation = true,
  onLogoutSuccess
}) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getButtonClasses = () => {
    const baseClasses = 'flex items-center justify-center rounded-md transition-colors';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white px-4 py-2`;
      case 'outline':
        return `${baseClasses} border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2`;
      case 'sidebar':
        return `${baseClasses} w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700`;
      case 'text':
        return `${baseClasses} text-red-600 hover:text-red-700 px-2 py-1`;
      default:
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white px-4 py-2`;
    }
  };

  const handleLogoutClick = () => {
    if (showConfirmation) {
      setShowConfirmDialog(true);
    } else {
      performLogout();
    }
  };

  const cancelLogout = () => {
    setShowConfirmDialog(false);
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError(null);
      await signOut();
      
      if (onLogoutSuccess) {
        onLogoutSuccess();
      } else {
        // Default behavior - redirect to home page
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setError('سەرکەوتوو نەبوو لە چوونە دەرەوە. تکایە دووبارە هەوڵ بدەرەوە.');
    } finally {
      setIsLoggingOut(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogoutClick}
        className={`${getButtonClasses()} ${className}`}
        disabled={isLoggingOut}
      >
        {showIcon && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        )}
        {isLoggingOut ? (
          <span className="flex items-center">
            <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-200 border-t-white"></span>
            چوونە دەرەوە...
          </span>
        ) : (
          <span>چوونە دەرەوە</span>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 mt-1">{error}</div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-100 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="rounded-full bg-red-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">دڵنیایت دەتەوێت چوونە دەرەوە بکەیت؟</h3>
              <p className="text-gray-600 mb-1">پێویستە دووبارە بێیتە ژوورەوە بۆ دەستگەیشتن بە هەژمارەکەت.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoggingOut}
              >
                نەخێر، بمێنەوە
              </button>
              <button
                onClick={performLogout}
                className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-medium"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    چاوەڕوانبە...
                  </span>
                ) : (
                  'بەڵێ، چوونە دەرەوە'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default LogoutButton; 