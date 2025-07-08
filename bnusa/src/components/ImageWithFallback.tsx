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
  ...imageProps
}: ImageWithFallbackProps) => {
  // For avatar placeholders, show a div with initials
  if (placeholderSize === 'avatar' && initials) {
    return (
      <div 
        className={`bg-[var(--primary)] flex items-center justify-center text-white w-full h-full ${className || ''}`}
        style={style}
      >
        <span className="font-medium">{initials}</span>
      </div>
    );
  }

  // For everything else, use standard Image
  return (
    <Image
      src={src}
      alt={alt || ''}
      width={width}
      height={height}
      fill={fill}
      className={className}
      style={style}
      {...imageProps}
    />
  );
};

export default ImageWithFallback; 