import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DocumentTextIcon, UserCircleIcon, ArrowLongLeftIcon } from '@heroicons/react/24/outline';

interface WriterCardProps {
  writer: {
    id: string | number;
    name: string;
    bio: string;
    avatar: string;
    articlesCount: number;
    followers: number;
    username?: string;
  };
}

/**
 * Modern writer card component with elegant styling and optimized performance
 */
const WriterCardOptimized = ({ writer }: WriterCardProps) => {
  // Extract initials for fallback avatar
  const initials = writer.name 
    ? writer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '';
    
  // State to track image loading errors
  const [imageError, setImageError] = React.useState(false);
  
  // Generate a random gradient for avatar background if no image
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ];
  
  // Use a hash of the name to consistently pick the same gradient for each writer
  const nameHash = writer.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradientIndex = nameHash % gradients.length;
  const avatarGradient = gradients[gradientIndex];

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group flex flex-col">
      {/* Card inner container with subtle hover effect */}
      <div className="flex flex-col flex-1">
        {/* Decorative accent at top */}
        <div className={`h-2 w-full bg-gradient-to-r ${avatarGradient}`}></div>
        
        <div className="p-6 flex flex-col flex-1">
          {/* Writer avatar with gradient circle background and improved spacing */}
          <div className="flex items-center mb-5">
            <div className={`w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br ${avatarGradient} relative flex items-center justify-center shadow-md border-2 border-white`}>
              {!imageError && writer.avatar ? (
                <Image
                  src={writer.avatar}
                  alt={`${writer.name} avatar`}
                  fill
                  sizes="64px"
                  style={{ objectFit: 'cover' }}
                  onError={() => setImageError(true)}
                  className="transition-transform group-hover:scale-110 duration-300"
                />
              ) : (
                <span className="text-xl font-bold text-white">{initials}</span>
              )}
            </div>
            
            <div className="mr-5 flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-[var(--primary)] transition-colors">{writer.name}</h3>
              <div className="flex items-center text-gray-500">
                <UserCircleIcon className="h-4 w-4 ml-1" />
                <span className="text-sm">نووسەر</span>
              </div>
            </div>
          </div>
          
          {/* Writer bio with fixed height to ensure stable layout */}
          <div className="h-[48px] mb-5 overflow-hidden"> {/* Fixed height container for bio */}
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {writer.bio || "بەکارهێنەر لە پلاتفۆرمی بنووسە"}
            </p>
          </div>
          
          {/* Article count with icon */}
          <div className="flex items-center justify-start mb-5 bg-[var(--primary-light)]/10 py-2 px-3 rounded-lg">
            <DocumentTextIcon className="h-5 w-5 text-[var(--primary)] ml-2" />
            <div>
              <span className="font-bold text-[var(--primary)]">                                   {writer.articlesCount}                              </span>
              <span className="text-sm text-gray-600 mr-1">وتار</span>
            </div>
          </div>
          
          {/* Spacer to push button to bottom */}
          <div className="flex-grow"></div>
          
          {/* View profile button with arrow icon */}
          <Link 
            href={`/users/${writer.username}`} 
            className="flex items-center justify-center w-full text-center py-2.5 px-4 rounded-lg transition-colors text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-medium text-sm group-hover:shadow-md"
          >
            <span>بینینی پڕۆفایل</span>
            <ArrowLongLeftIcon className="h-5 w-5 mr-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WriterCardOptimized; 