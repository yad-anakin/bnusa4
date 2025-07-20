'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useTheme } from '@/utils/themeContext';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out';
  delay?: number;
  threshold?: number;
  className?: string;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Component that animates its children when they enter the viewport
 */
const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  threshold = 0.1,
  className = '',
  rootMargin = '0px',
  once = true,
}) => {
  const { reduceMotion } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (reduceMotion) {
      setIsVisible(true);
      return;
    }

    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (once && hasAnimated) return;
          
          // Delay the animation if specified
          if (delay) {
            setTimeout(() => {
              setIsVisible(true);
              setHasAnimated(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasAnimated(true);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [delay, once, hasAnimated, reduceMotion, rootMargin, threshold]);

  // Define animation classes
  const getAnimationClasses = () => {
    if (reduceMotion) return '';
    
    const animationClasses = {
      base: 'transition-all duration-700 ease-out',
      states: {
        hidden: {
          'fade-up': 'opacity-0 translate-y-10',
          'fade-down': 'opacity-0 -translate-y-10',
          'fade-left': 'opacity-0 translate-x-10',
          'fade-right': 'opacity-0 -translate-x-10',
          'zoom-in': 'opacity-0 scale-95',
          'zoom-out': 'opacity-0 scale-105',
        },
        visible: 'opacity-100 translate-y-0 translate-x-0 scale-100',
      },
    };

    return `${animationClasses.base} ${isVisible 
      ? animationClasses.states.visible 
      : animationClasses.states.hidden[animation]}`;
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation; 