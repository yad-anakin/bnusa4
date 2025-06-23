'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
}

const defaultContext: ThemeContextType = {
  isHighContrast: false,
  toggleHighContrast: () => {},
  fontSize: 'medium',
  setFontSize: () => {},
  reduceMotion: false,
  toggleReduceMotion: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check for user preferences in localStorage or system settings
    const storedHighContrast = localStorage.getItem('high-contrast');
    if (storedHighContrast) {
      setIsHighContrast(storedHighContrast === 'true');
    }

    const storedFontSize = localStorage.getItem('font-size') as 'small' | 'medium' | 'large' | null;
    if (storedFontSize) {
      setFontSize(storedFontSize);
    }

    const storedReduceMotion = localStorage.getItem('reduce-motion');
    if (storedReduceMotion) {
      setReduceMotion(storedReduceMotion === 'true');
    } else {
      // Check system preference for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReduceMotion(prefersReducedMotion);
    }
  }, []);

  // Apply theme changes to the document
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
    localStorage.setItem('high-contrast', String(isHighContrast));
  }, [isHighContrast]);

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
    localStorage.setItem('font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
    localStorage.setItem('reduce-motion', String(reduceMotion));
  }, [reduceMotion]);

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
  };

  const handleSetFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
  };

  const toggleReduceMotion = () => {
    setReduceMotion((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        isHighContrast,
        toggleHighContrast,
        fontSize,
        setFontSize: handleSetFontSize,
        reduceMotion,
        toggleReduceMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 