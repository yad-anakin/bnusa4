'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  placeholderSize?: 'avatar' | 'article' | 'hero' | 'banner';
  placeholderType?: 'primary' | 'secondary' | 'tertiary';
  initials?: string;
  withPattern?: boolean;
  useB2Fallback?: boolean;
  forceSize?: boolean;
  preventRedownload?: boolean;
  onLoadFailure?: (error: any) => void;
}

/**
 * Simple replacement for the original ImageWithFallback component
 * Just renders a standard Image or a div with initials if it's an avatar
 */
const ImageWithFallback = ({
  src,
  alt,
  initials,
  placeholderSize = 'avatar',
  width,
  height,
  fill,
  className,
  style,
  fallbackSrc,
  placeholderType,
  withPattern,
  useB2Fallback,
  forceSize,
  preventRedownload,
  onLoadFailure,
  priority,
  ...imageProps
}: ImageWithFallbackProps) => {
  // Handle old S3 URL by replacing it with the correct one
  const correctedSrc = src && src.includes('bnusa-images.s3.us-east-005.backblazeb2.com') 
    ? src.replace('https://bnusa-images.s3.us-east-005.backblazeb2.com/defaults/default-banner-primary.jpg', 'https://f005.backblazeb2.com/file/bnusa-images/banners/9935e1b6-4094-45b9-aafd-05ea6c6a1816.jpg')
    : src;

  // For avatar placeholders, show initials if there's no valid image source
  if (placeholderSize === 'avatar' && (!correctedSrc || correctedSrc === '' || correctedSrc === 'undefined')) {
    return (
      <div 
        className={`bg-[var(--primary)] flex items-center justify-center text-white w-full h-full ${className || ''}`}
        style={style}
      >
        <span className="font-medium">{initials || 'U'}</span>
      </div>
    );
  }

  // For everything else, use standard Image with a fallback src if needed
  const finalSrc = correctedSrc || fallbackSrc || '/default-avatar.png';
  
  // Remove legacy 'layout' prop if present
  if ('layout' in imageProps) {
    delete imageProps['layout'];
  }

  // If fill is true and sizes is not provided, set a more accurate default
  let defaultSizes = undefined;
  if (fill && !('sizes' in imageProps)) {
    if (placeholderSize === 'avatar') {
      defaultSizes = '40px';
    } else if (placeholderSize === 'article' || placeholderSize === 'hero' || placeholderSize === 'banner') {
      defaultSizes = '(max-width: 1200px) 100vw, 1200px';
    }
  }

  return (
    <Image
      src={finalSrc}
      alt={alt || ''}
      width={width}
      height={height}
      fill={fill}
      className={className}
      style={style}
      priority={priority}
      {...imageProps}
      {...(defaultSizes ? { sizes: defaultSizes } : {})}
    />
  );
};

export default ImageWithFallback; 