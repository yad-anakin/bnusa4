'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ImageWithFallback from './ImageWithFallback';

interface ArticleImageGalleryProps {
  images: string[];
  className?: string;
}

const ArticleImageGallery: React.FC<ArticleImageGalleryProps> = ({ 
  images = [], 
  className = '' 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Return null if no images
  if (!images.length) return null;

  // Determine grid layout based on number of images
  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 md:grid-cols-3';
      case 4:
        return 'grid-cols-2 md:grid-cols-4';
      default: // 5 images
        return 'grid-cols-2 md:grid-cols-3';
    }
  };

  // Get specific item styles based on the number of images and index
  const getItemClass = (index: number) => {
    if (images.length === 3 && index === 0) {
      return 'col-span-2 md:col-span-1'; // First image takes full width on mobile
    }
    if (images.length === 5) {
      if (index === 0) {
        return 'col-span-2 row-span-2'; // First image is larger
      }
    }
    return '';
  };

  return (
    <div className={`my-6 ${className}`}>
      <div className={`grid ${getGridClass()} gap-2 relative`}>
        {images.map((image, index) => (
          <div 
            key={index} 
            className={`relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition ${getItemClass(index)}`}
            onClick={() => setSelectedImage(image)}
          >
            <div className="aspect-square w-full relative">
              <ImageWithFallback
                src={image}
                alt={`Article image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                placeholderSize="article"
              />
            </div>
            {images.length > 3 && index >= 3 && images.length === 5 && index === 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button 
              className="absolute top-4 right-4 bg-white/20 rounded-full p-2 text-white z-10 hover:bg-white/40 transition"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full h-[80vh]">
              <ImageWithFallback
                src={selectedImage}
                alt="Enlarged image"
                fill
                className="object-contain"
                sizes="100vw"
                placeholderSize="hero"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleImageGallery; 