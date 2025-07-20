'use client';

import { useEffect, useState } from 'react';
import usePreloadImages from '@/utils/usePreloadImages';
import { usePathname } from 'next/navigation';

// List of essential images used across multiple pages
// These will be preloaded once and cached to prevent B2 API calls on refresh
const COMMON_IMAGES = [
  // Banner images
  '/images/img/bnusa-name.png',
  '/images/default-banner.jpg',
  
  // Logo and branding
  '/images/logo.png',
  '/images/logo-white.png',
];

// Page-specific critical images
const PAGE_SPECIFIC_IMAGES: Record<string, string[]> = {
  '/': [
    // Homepage specific images
    '/images/img/bnusa-name.png',
    '/images/patterns/pattern-dots.svg',
  ],
  '/publishes': [
    // Publishes page specific images (now empty as placeholder was removed)
  ],
};

/**
 * B2ImagePreloader - Preloads important B2 images on first visit
 * to prevent multiple API calls on page refresh
 * 
 * This component uses intelligent preloading:
 * 1. Loads images only once per session
 * 2. Uses idle time to avoid impacting page performance
 * 3. Stores images in browser cache and our image registry
 * 4. Skips unnecessary preloads for images already in cache
 */
export default function B2ImagePreloader() {
  const pathname = usePathname();
  const [pageImagesLoaded, setPageImagesLoaded] = useState<boolean>(false);
  
  // Get page-specific images based on current route
  const pageSpecificImages = PAGE_SPECIFIC_IMAGES[pathname] || [];
  
  // Preload common images used across the site (one-time operation)
  const { preloaded: commonPreloaded } = usePreloadImages(COMMON_IMAGES, {
    // Use a longer delay for common images to prioritize visible content
    preloadDelay: 3000,
    lowPriority: true,
  });
  
  // Preload page-specific critical images with higher priority
  const { preloaded: pagePreloaded } = usePreloadImages(pageSpecificImages, {
    // Load page-specific images sooner
    preloadDelay: 1500,
    lowPriority: pathname === '/publishes', // Use low priority for image-heavy pages
  });
  
  // Track when all images are loaded
  useEffect(() => {
    if (commonPreloaded && pagePreloaded) {
      setPageImagesLoaded(true);
    }
  }, [commonPreloaded, pagePreloaded]);
  
  // This component doesn't render anything visible
  return null;
} 