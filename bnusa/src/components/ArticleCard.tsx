'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  title: string;
  description: string;
  author: {
    name: string;
    username?: string;
    profileImage?: string;
    isWriter?: boolean;
    isSupervisor?: boolean;
    isDesigner?: boolean;
  } | null;
  slug: string;
  categories?: string[];
  status?: string;
  coverImage?: string;
  priority?: boolean; // <-- Add this line
}

const isBackblazeUrl = (url: string | undefined) => {
  if (!url) return false;
  return url.startsWith('https://') && !url.includes('/images/');
};

const ArticleCard = ({ title, description, author, slug, categories = [], status, coverImage, priority = false }: ArticleCardProps) => {
  // Default author object to prevent null reference errors
  const safeAuthor = author || { name: "Unknown Author" };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-[var(--grey-light)] flex flex-col h-full">
      <div className="relative h-48 bg-[var(--grey-light)]">
        <Image
          src={coverImage || `/images/placeholders/article-primary.png`}
          alt={title}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority} // <-- Pass the prop here
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
            </div>
            
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--primary)] relative">
              {safeAuthor.profileImage && isBackblazeUrl(safeAuthor.profileImage) ? (
                <Image
                  src={safeAuthor.profileImage}
                  alt={safeAuthor.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--primary)] text-white text-sm font-medium">
                  {safeAuthor.name.substring(0, 2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard; 