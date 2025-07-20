import React from 'react';
import Link from 'next/link';

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

const WriterCard = ({ writer }: WriterCardProps) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-[var(--grey-light)] p-6">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-[var(--primary)] relative flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {writer.name.substring(0, 2)}
          </span>
        </div>
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{writer.name}</h3>
        <p className="text-[var(--grey-dark)] text-center mb-4 line-clamp-3">{writer.bio}</p>
        
        <div className="flex justify-center space-x-6 mb-6 w-full">
          <div className="text-center">
            <span className="block text-lg font-bold text-[var(--primary)]">{writer.articlesCount}</span>
            <span className="text-sm text-[var(--grey)]">وتار</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-[var(--primary)]">{writer.followers}</span>
            <span className="text-sm text-[var(--grey)]">بەدواداچووان</span>
          </div>
        </div>
        
        <Link href={`/users/${writer.username}`} className="btn btn-outline w-full text-center">
          بینینی پڕۆفایل
        </Link>
      </div>
    </div>
  );
};

export default WriterCard; 