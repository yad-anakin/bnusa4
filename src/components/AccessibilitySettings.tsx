'use client';

import React, { useState } from 'react';
import { useTheme } from '@/utils/themeContext';

interface AccessibilitySettingsProps {
  className?: string;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ className = '' }) => {
  const { isHighContrast, toggleHighContrast, fontSize, setFontSize, reduceMotion, toggleReduceMotion } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={togglePanel}
        className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        aria-label="Accessibility Settings"
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">ڕێکخستنی خێرا</h3>
            <button
              onClick={togglePanel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              aria-label="Close accessibility settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="high-contrast" className="font-medium text-gray-700 dark:text-gray-300">
                تۆخکردنی ڕەنگەکان
              </label>
              <button
                id="high-contrast"
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  isHighContrast ? 'bg-primary' : 'bg-gray-300'
                } transition-colors duration-200`}
                role="switch"
                aria-checked={isHighContrast}
              >
                <span 
                  className={`${
                    isHighContrast ? '-translate-x-1' : '-translate-x-6'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                />
              </button>
            </div>
            
            {/* Font Size Controls */}
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                قەبارەی فۆنت
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFontSize('small')}
                  className={`px-3 py-1 rounded-md ${
                    fontSize === 'small' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={fontSize === 'small'}
                >
                  بچووک
                </button>
                <button
                  onClick={() => setFontSize('medium')}
                  className={`px-3 py-1 rounded-md ${
                    fontSize === 'medium' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={fontSize === 'medium'}
                >
                  ناوەند
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-3 py-1 rounded-md ${
                    fontSize === 'large' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={fontSize === 'large'}
                >
                  گەورە
                </button>
              </div>
            </div>
            
            {/* Reduce Motion Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="reduce-motion" className="font-medium text-gray-700 dark:text-gray-300">
                ئەنیمەیشن و بزواندن
              </label>
              <button
                id="reduce-motion"
                onClick={toggleReduceMotion}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  reduceMotion ? 'bg-primary' : 'bg-gray-300'
                } transition-colors duration-200`}
                role="switch"
                aria-checked={reduceMotion}
              >
                <span 
                  className={`${
                    reduceMotion ? '-translate-x-1' : '-translate-x-6'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                />
              </button>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ئەم ڕێکخستنانە پاشەکەوت دەکرێن لە براوسەرەکەت بە درێژایی ماڵپەڕی بنووسە.
            </p>
          </div>
        </div>
      )}
      
      {/* Overlay for closing the panel when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 background1" 
          onClick={togglePanel}
          aria-hidden="true"
          
        />
      )}
    </div>
  );
};

export default AccessibilitySettings; 