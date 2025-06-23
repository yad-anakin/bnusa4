'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { useTheme } from '@/utils/themeContext';
import { getDefaultBannerUrl, getDefaultProfileUrl } from '@/utils/imageUpload';
import { usePathname } from 'next/navigation';
import api from '@/utils/api';

// Define external function reference for isImageAlreadyLoaded
// This is needed because we can't directly access the function from api utils
const isImageAlreadyLoadedFn: ((url: string) => boolean) | null = null;

// Default fallback image URL
const DefaultFallbackImage = '/images/default-fallback.png';

// Local cache for already viewed images in this session
// This prevents repeated requests to the same image
const localImageCache: Record<string, boolean> = {};

// Add a sessionStorage key for the refresh cache
const SESSION_CACHE_KEY = 'bnusa_image_session_cache';

// Global session cache to prevent reloads on page refresh
let sessionImageCache: Record<string, boolean> = {};

// Initialize the session cache
if (typeof window !== 'undefined') {
  try {
    const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
    sessionImageCache = cached ? JSON.parse(cached) : {};
  } catch (e) {
    console.warn('Error loading session image cache:', e);
    sessionImageCache = {};
  }
}

// Add a helper to save to session cache
const addToSessionCache = (url: string) => {
  if (!url || typeof window === 'undefined') return;
  
  try {
    const normalizedUrl = normalizeUrl(url);
    sessionImageCache[normalizedUrl] = true;
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionImageCache));
  } catch (e) {
    console.warn('Error saving to session cache:', e);
  }
};

// Check if an image is in session cache
const isInSessionCache = (url: string): boolean => {
  if (!url || typeof window === 'undefined') return false;
  
  try {
    const normalizedUrl = normalizeUrl(url);
    return Boolean(sessionImageCache[normalizedUrl]);
  } catch (e) {
    return false;
  }
};

// Normalize image URLs to use as cache keys
const normalizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    // Create URL object to manipulate params
    const urlObj = new URL(url);
    
    // Remove cache busting parameters
    urlObj.searchParams.delete('t');
    urlObj.searchParams.delete('_t');
    urlObj.searchParams.delete('cache');
    urlObj.searchParams.delete('timestamp');
    
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, just return the original
    return url;
  }
};

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  placeholderSize?: 'avatar' | 'article' | 'hero' | 'banner';
  placeholderType?: 'primary' | 'secondary' | 'tertiary';
  initials?: string;
  withPattern?: boolean;
  useB2Fallback?: boolean; // Whether to fetch fallback from B2 or use local
  forceSize?: boolean; // Force size optimization even for non-B2 images
  preventRedownload?: boolean; // Specifically prevent duplicate downloads for this image
  onLoadFailure?: (error: any) => void; // Callback when image load fails
  className?: string;
  lazyLoadThreshold?: number; // Distance in pixels to pre-load before entering viewport
}

// Helper to check if a URL is a Backblaze B2 URL
const isB2ImageUrl = (url: string): boolean => {
  return Boolean(url && typeof url === 'string' && (
    url.includes('b-cdn.net') || 
    url.includes('backblazeb2.com') || 
    url.includes('bnusaimages')
  ));
};

// Helper to check if an image is likely a user profile image that changes frequently
const isProfileImage = (url: string): boolean => {
  return Boolean(url && typeof url === 'string' && (
    url.includes('/profile/') || 
    url.includes('/user-images/') || 
    url.includes('/avatar/')
  ));
};

/**
 * Enhanced Image component with fallback support
 * Automatically handles image loading errors by showing blue background with initials for avatars
 * and a default banner for banner images
 */
const ImageWithFallback = ({
  src,
  fallbackSrc,
  alt,
  placeholderSize = 'avatar',
  placeholderType = 'primary',
  initials,
  withPattern = false,
  useB2Fallback = false,
  forceSize = false,
  preventRedownload = true,
  onLoadFailure,
  className,
  lazyLoadThreshold = 200, // Load when image is within 200px of viewport
  ...props
}: ImageWithFallbackProps) => {
  const [error, setError] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string>(src);
  const imageRef = useRef<HTMLDivElement>(null);
  const { isHighContrast } = useTheme();
  const pathname = usePathname();
  
  // Check if we're on pages with many images to optimize B2 usage
  const isHighVolumeImagePage = pathname === '/writers' || pathname === '/publishes';
  
  // Skip B2 fallback for high-volume pages to reduce API calls
  const shouldUseB2Fallback = useB2Fallback && !isHighVolumeImagePage;
  
  // Force refresh the component when src changes
  // This is particularly important for profile images that might be updated
  useEffect(() => {
    if (src) {
      // Reset the state completely when the source changes
      setImgSrc(src);
      setError(false);
      setLoaded(false);
    }
  }, [src]);

  // Modified to avoid timestamp params for most images
  const getCacheControlledUrl = (url: string) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
    
    // For Navbar user images and profile images that need frequent updates
    if (isProfileImage(url)) {
      // Check if it's a navbar image (keep previous optimization)
      if (url.includes('currentUser.photoURL')) {
        // Use a static timestamp to avoid constant refreshing
        const staticTimestamp = Math.floor(Date.now() / (60 * 60 * 1000)); // Changes hourly
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${staticTimestamp}`;
      } 
      // For other profile images, we still refresh but less aggressively
      else {
        // Use a daily timestamp to reduce requests but still update occasionally
        const separator = url.includes('?') ? '&' : '?';
        const dailyTimestamp = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
        return `${url}${separator}t=${dailyTimestamp}`;
      }
    }
    
    // For B2 images, optimize size but don't add timestamps
    if (isB2ImageUrl(url)) {
      // If the image is used in a card or small context, request a smaller version
      if (placeholderSize === 'article' || props.width && (typeof props.width === 'number' && props.width < 400)) {
        const separator = url.includes('?') ? '&' : '?';
        // Add size parameters to request a smaller image from B2
        return `${url}${separator}w=400&q=80`;
      }
      // Return the URL as-is for B2 images
      return url;
    }
    
    // For other images, use a weekly timestamp
    // This is a good balance between freshness and caching
    const separator = url.includes('?') ? '&' : '?';
    const weeklyTimestamp = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return `${url}${separator}t=${weeklyTimestamp}`;
  };

  const handleError = async () => {
    if (!error) {
      setError(true);
      
      // If the failed image is a B2 image, try to refresh its cache
      if (isB2ImageUrl(src)) {
        api.refreshImageCache(src);
      }
      
      if (fallbackSrc) {
        // Use the explicit fallback source provided
        setImgSrc(fallbackSrc);
      } else if (shouldUseB2Fallback && placeholderSize === 'banner') {
        // For banners only, try to get fallback from B2
        try {
          const b2Url = await getDefaultBannerUrl();
          console.log("Using B2 banner fallback URL:", b2Url);
          setImgSrc(b2Url);
        } catch (e) {
          console.error("Error fetching B2 fallback image:", e);
          // If B2 fetch fails, use local fallback
          const localPath = `/images/deafult-banner.jpg`;
          console.log("B2 fallback failed, using local banner path:", localPath);
          setImgSrc(localPath);
        }
      } else {
        // For other image types, especially avatars, we'll display a colored div with initials
        // We won't set an image source, just trigger rendering the fallback div
        setLoaded(false); // Keep loaded false to show the fallback div
      }
    }
  };

  const handleImageLoad = () => {
    setLoaded(true);
    
    // Client-side only effects after load
    if (typeof window !== 'undefined') {
      // Add to local cache to prevent future downloads
      const normalizedSrc = normalizeUrl(src);
      if (normalizedSrc && preventRedownload) {
        localImageCache[normalizedSrc] = true;
        
        // Add to session cache to prevent reloads on page refresh
        addToSessionCache(normalizedSrc);
        
        // Try to add to api registry too
        try {
          if (api && typeof (api as any).registerImageLoad === 'function') {
            (api as any).registerImageLoad(src);
          }
        } catch (e) {
          console.warn('Error registering image load:', e);
        }
      }
    }
  };

  // Use the fallback image when there's an error
  const imageSrc = error ? (fallbackSrc || DefaultFallbackImage) : imgSrc;
  
  // Simplified approach for SSR compatibility
  return (
    <div ref={imageRef} className="relative w-full h-full">
      {/* Image element */}
        <Image
        {...(props.fill ? { fill: true } : {})}
        {...(props.width && !props.fill ? { width: props.width, height: props.height } : {})}
        src={getCacheControlledUrl(imageSrc)}
          alt={alt}
          onError={handleError}
        onLoad={handleImageLoad}
        loading={props.priority ? undefined : (props.loading || "lazy")}
        className={`${className || ''} transition-opacity duration-300`}
        style={{
          ...props.style,
          opacity: 1, // Always start visible - we'll handle fading with CSS transitions
        }}
        sizes={props.sizes}
        quality={props.quality}
        priority={props.priority}
      />
      
      {/* Fallback content using CSS for transitions */}
        <div 
          className={`absolute inset-0 flex items-center justify-center ${
            placeholderSize === 'avatar' 
              ? 'bg-[var(--primary)]' // Blue background for avatars
              : 'bg-[var(--grey-light)]' // Light grey for other images
        } transition-opacity duration-300`}
        style={{
          opacity: loaded ? 0 : 1, // Control visibility with CSS
          pointerEvents: loaded ? 'none' : 'auto',
        }}
        >
          {initials && placeholderSize === 'avatar' ? (
            <span className="text-lg font-bold text-white">{initials}</span>
          ) : (
            withPattern && (
              <div className="absolute inset-0 opacity-20" 
                   style={{ backgroundImage: "url('/images/patterns/pattern-dots.svg')", backgroundSize: '12px' }}
              />
            )
          )}
        </div>
    </div>
  );
};

export default ImageWithFallback; 