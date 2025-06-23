'use client';

import Link from 'next/link';
import ImageWithFallback from './ImageWithFallback';

interface ArticleCardProps {
  title: string;
  description: string;
  author: {
    name: string;
    username?: string;
    profileImage?: string;
    isWriter?: boolean;
  } | null;
  slug: string;
  categories?: string[];
  status?: string;
  coverImage?: string;
}

const ArticleCard = ({ title, description, author, slug, categories = [], status, coverImage }: ArticleCardProps) => {
  // Default author object to prevent null reference errors
  const safeAuthor = author || { name: "Unknown Author" };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-[var(--grey-light)] flex flex-col h-full">
      <div className="relative h-48 bg-[var(--grey-light)]">
        <ImageWithFallback
          src={coverImage || `/images/placeholders/article-primary.png`}
          alt={title}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          placeholderSize="article"
          placeholderType="primary"
          withPattern={!coverImage}
          priority={false}
        />
        {categories && categories.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-wrap gap-1 max-w-[80%]">
            {categories.slice(0, 2).map((category, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-white/80 backdrop-blur-sm rounded text-[var(--foreground)] font-medium">
                {category}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="px-2 py-1 text-xs bg-white/80 backdrop-blur-sm rounded text-[var(--foreground)] font-medium">
                +{categories.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Status badge for non-published articles */}
        {status && status !== 'published' && (
          <div className="absolute bottom-3 left-3">
            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
              status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              status === 'rejected' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {status === 'pending' ? 'چاوەڕوانی پێداچوونەوە' : 
               status === 'rejected' ? 'ڕەتکراوەتەوە' : 
               status === 'draft' ? 'ڕەشنووس' : status}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-grow flex flex-col text-right">
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 line-clamp-2">{title}</h3>
        <p className="text-[var(--grey-dark)] mb-4 line-clamp-3 flex-grow">{description}</p>
        
        <div className="flex items-center justify-between mt-4">
          <Link href={`/publishes/${slug}`} className="btn btn-outline text-sm whitespace-nowrap">
            زیاتر بخوێنەوە
          </Link>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              {safeAuthor.username ? (
                <Link 
                  href={`/users/${safeAuthor.username}`} 
                  className="text-sm font-medium text-[var(--grey-dark)] hover:text-[var(--primary)] transition-colors"
                >
                  {safeAuthor.name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-[var(--grey-dark)]">{safeAuthor.name}</span>
              )}
              
              {safeAuthor.isWriter && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  نووسەر
                </span>
              )}
            </div>
            
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--primary)] relative">
              <ImageWithFallback
                src={safeAuthor.profileImage || `/images/placeholders/avatar-${safeAuthor.name.substring(0, 2).toLowerCase()}-primary.png`}
                alt={`${safeAuthor.name} avatar`}
                fill
                style={{ objectFit: 'cover' }}
                placeholderSize="avatar"
                placeholderType="primary"
                initials={safeAuthor.name.substring(0, 2)}
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard; 