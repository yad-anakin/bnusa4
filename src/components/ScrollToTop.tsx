'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/utils/themeContext';

interface ScrollToTopProps {
  threshold?: number;
  className?: string;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  threshold = 400,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { reduceMotion } = useTheme();

  // Show button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  // Scroll to top function
  const scrollToTop = () => {
    if (reduceMotion) {
      // For reduced motion, instantly jump to top
      window.scrollTo(0, 0);
    } else {
      // Smooth scroll
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <button
      className={`fixed bottom-6 right-20 z-40 p-3 bg-[var(--primary)] text-white rounded-full shadow-lg hover:bg-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      } ${className}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
};

export default ScrollToTop; 