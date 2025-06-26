'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from './ImageWithFallback';
import { usePathname } from 'next/navigation';

// Default image path
const DEFAULT_ARTICLE_IMAGE = '/images/placeholders/article-default.jpg';

// Article Status Types
type ArticleStatus = 'published' | 'pending' | 'draft' | 'rejected';

interface ArticleCardProps {
  title: string;
  description?: string;
  categories?: string[];
  coverImage?: string;
  author?: {
    name: string;
    username?: string;
    profileImage?: string;
    isWriter?: boolean;
    isSupervisor?: boolean;
    isDesigner?: boolean;
  };
  slug: string;
  createdAt?: string;
  status?: string;
  isPromoted?: boolean;
}

// Helper function to safely access author properties
const safeAuthorProp = (author: ArticleCardProps['author'] | undefined, prop: string) => {
  if (!author) return null;
  return (author as any)[prop];
};

const ArticleCard = ({ 
  title, 
  description, 
  author, 
  slug, 
  categories,
  coverImage,
  createdAt,
  status = 'published',
  isPromoted = false
}: ArticleCardProps) => {
  const [imageError, setImageError] = useState(false);
  const pathname = usePathname();
  const isAuthorProfilePage = pathname ? pathname.includes('/users/') : false;

  const safeAuthor = author || { name: 'Unknown Author' };
  
  // Process article status
  const articleStatus = status ? status.toLowerCase() as ArticleStatus : 'published';
  
  const statusStyles: Record<ArticleStatus, { bg: string, text: string, label: string }> = {
    published: { bg: 'bg-green-100', text: 'text-green-800', label: 'بڵاوکراوە' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'چاوەڕوانی پەسەندکردن' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ڕەشنووس' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'ڕەتکراوەتەوە' },
  };
  
  const currentStatus = statusStyles[articleStatus] || statusStyles.published;

  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="relative pt-[56.25%] bg-gray-100">
        <Link href={`/articles/${slug}`} className="absolute inset-0">
          <img
            src={imageError ? DEFAULT_ARTICLE_IMAGE : (coverImage || DEFAULT_ARTICLE_IMAGE)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImageError(true)}
          />
        </Link>
        
        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="absolute bottom-2 right-2 flex flex-wrap gap-1 max-w-[calc(100%-1rem)]">
            {categories.slice(0, 2).map((category, index) => (
              <span 
                key={index} 
                className="bg-white/80 backdrop-blur-sm text-[var(--foreground)] text-xs px-2 py-0.5 rounded-full"
              >
                {category}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="bg-white/80 backdrop-blur-sm text-[var(--foreground)] text-xs px-2 py-0.5 rounded-full">
                +{categories.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Status Badge for admin views */}
        {status && status !== 'published' && (
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${currentStatus.bg} ${currentStatus.text}`}>
              {currentStatus.label}
            </span>
          </div>
        )}
        
        {/* Promoted Badge */}
        {isPromoted && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[var(--primary)]/90 text-white">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              تایبەت
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-5 flex-grow flex flex-col">
        <Link href={`/articles/${slug}`} className="block mb-3">
          <h3 className="font-bold text-lg sm:text-xl text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-2 transition-colors">
            {title}
          </h3>
        </Link>
        
        {description && (
          <p className="text-gray-600 text-sm sm:text-base line-clamp-2 mb-4">
            {description}
          </p>
        )}
        
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-start justify-between">
          <div className="flex items-center">
            <Link href={safeAuthor.username ? `/users/${safeAuthor.username}` : '#'} className="flex items-center group">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2 flex-shrink-0">
                {safeAuthor.profileImage ? (
                  <img 
                    src={safeAuthor.profileImage} 
                    alt={`${safeAuthor.name} avatar`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/placeholders/avatar-default.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                    {safeAuthor.name.substring(0, 1)}
                  </div>
                )}
              </div>
              <div>
                <span className="block text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  {safeAuthor.name}
                </span>
                {!isAuthorProfilePage && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {safeAuthor.isWriter && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        نووسەر
                      </span>
                    )}
                    {safeAuthor.isSupervisor && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                        </svg>
                        سەرپەرشتیار
                      </span>
                    )}
                    {safeAuthor.isDesigner && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                        </svg>
                        دیزاینەر
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </div>
          
          {createdAt && (
            <div className="text-gray-500 text-xs whitespace-nowrap">
              {new Date(createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard; 