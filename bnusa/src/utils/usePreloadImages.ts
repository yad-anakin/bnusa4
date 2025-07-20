import { useEffect, useState } from 'react';
import api from './api';

// Session-level cache to prevent duplicate preloads
const preloadedImages: Set<string> = new Set();

interface UsePreloadImagesOptions {
  preloadDelay?: number;     // Time to wait before starting preloads (ms)
  lowPriority?: boolean;     // Only load when network is idle
  disableOnSlowConnections?: boolean; // Skip preloading on slow connections
}

/**
 * Hook to preload and cache critical images to prevent API requests on subsequent page loads
 * Intelligently manages loading to minimize B2 API calls
 */
export function usePreloadImages(
  imageUrls: string[], 
  options: UsePreloadImagesOptions = {}
) {
  const [preloaded, setPreloaded] = useState<boolean>(false);
  const [preloadedUrls, setPreloadedUrls] = useState<string[]>([]);
  
  const {
    preloadDelay = 1000,
    lowPriority = true,
    disableOnSlowConnections = true
  } = options;

  useEffect(() => {
    // Skip if no images, or all are already preloaded
    if (!imageUrls.length || imageUrls.every(url => preloadedImages.has(url))) {
      setPreloaded(true);
      return;
    }

    // Filter out already preloaded images
    const imagesToPreload = imageUrls.filter(url => !preloadedImages.has(url));
    
    // Skip if no new images to preload
    if (!imagesToPreload.length) {
      setPreloaded(true);
      return;
    }

    // Check connection before loading
    if (disableOnSlowConnections && typeof navigator !== 'undefined') {
      // Check network connection quality if available
      // @ts-ignore - Navigator connection API isn't fully typed in standard lib
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection && typeof connection.effectiveType === 'string') {
        const connectionType = connection.effectiveType;
        if (connectionType === '2g' || connectionType === 'slow-2g') {
          console.log('Skipping preload on slow connection:', connectionType);
          return;
        }
      }
    }

    let preloadTimer: NodeJS.Timeout;
    
    const preloadImages = () => {
      // If we're using lowPriority mode, use requestIdleCallback
      if (lowPriority && 'requestIdleCallback' in window) {
        // @ts-ignore - requestIdleCallback exists in modern browsers
        window.requestIdleCallback(() => {
          performPreload(imagesToPreload);
        }, { timeout: 10000 });
      } else {
        // Direct preload if priority is high
        performPreload(imagesToPreload);
      }
    };
    
    // Set a timer to start preloading after delay
    preloadTimer = setTimeout(preloadImages, preloadDelay);
    
    return () => {
      clearTimeout(preloadTimer);
    };
  }, [imageUrls, preloadDelay, lowPriority, disableOnSlowConnections]);
  
  // Function to actually perform the preloading
  const performPreload = (urls: string[]) => {
    // Track successful preloads
    const successful: string[] = [];
    
    // Incrementally preload to avoid network congestion
    const preloadNext = (index: number) => {
      if (index >= urls.length) {
        // All done
        setPreloaded(true);
        setPreloadedUrls(successful);
        return;
      }
      
      const url = urls[index];
      
      // Skip if already preloaded
      if (preloadedImages.has(url)) {
        preloadNext(index + 1);
        return;
      }
      
      // Check if this URL is already in the api registry
      if (api.isImageAlreadyLoaded && api.isImageAlreadyLoaded(url)) {
        // Already loaded in registry, mark as preloaded
        preloadedImages.add(url);
        successful.push(url);
        preloadNext(index + 1);
        return;
      }
      
      // Create an image to load the URL
      const img = new Image();
      
      img.onload = () => {
        // Successfully loaded
        preloadedImages.add(url);
        successful.push(url);
        
        // Register with the api registry if possible
        if (api.registerImageLoad) {
          api.registerImageLoad(url);
        }
        
        // Load the next image
        preloadNext(index + 1);
      };
      
      img.onerror = () => {
        // Skip failed images
        console.warn(`Failed to preload image: ${url}`);
        preloadNext(index + 1);
      };
      
      // Start loading
      img.src = url;
    };
    
    // Start the preload chain with the first image
    preloadNext(0);
  };
  
  return { preloaded, preloadedUrls };
}

export default usePreloadImages; 