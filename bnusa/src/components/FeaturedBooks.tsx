'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/utils/themeContext';

type Book = {
  _id: string;
  id?: string;
  title: string;
  writer: string;
  language: string;
  genre: string;
  year: number;
  image: string;
  rating: number;
  downloads: number;
};

type FeaturedBooksProps = {
  books: Book[];
  loading: boolean;
  totalBooks: number;
};

const FeaturedBooks = ({ books, loading, totalBooks }: FeaturedBooksProps) => {
  const { reduceMotion } = useTheme();
  
  // Number of books to display
  const booksToShow = 6;
  
  const animationClass = reduceMotion ? '' : 'transition-all duration-500 ease-out';

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">نوێترین کتێبەکان</h2>
          <div className="flex justify-center items-center h-64">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  // Display a message if no books are found
  if (books.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">نوێترین کتێبەکان</h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-[var(--grey-dark)]">هیچ کتێبێک نەدۆزرایەوە.</p>
            <p className="mt-4">
              <Link href="/bookstore" className="text-[var(--primary)] hover:underline">
                سەردانی کتێبخانە بکە!
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Get a slice of books to show
  const displayedBooks = books.slice(0, booksToShow);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold mb-8">نوێترین کتێبەکان</h2>
            <Link href="/bookstore" className="text-[var(--primary)] hover:underline flex items-center">
              هەموو کتێبەکان ببینە ({totalBooks})
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          {books.length > booksToShow && (
            <p className="text-sm text-[var(--grey)] mt-2">
              نیشاندانی {displayedBooks.length} لە کۆی {books.length} کتێب
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {displayedBooks.map((book, index) => (
            <div
              key={book._id}
              className={`${animationClass} ${
                reduceMotion ? '' : `opacity-0 translate-y-4`
              }`}
              style={{ 
                animation: reduceMotion ? 'none' : `fadeInUp 0.5s ease-out ${index * 0.1 + 0.2}s forwards` 
              }}
            >
              <Link href={`/bookstore/${book.id}`}>
                <div className="group relative bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-gray-100 hover:border-[var(--primary)]/50 transition-colors duration-300">
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={book.image}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--primary)]">{book.genre}</span>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="text-xs text-gray-700 font-medium">{book.downloads || 0}</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium mb-1 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-700 line-clamp-1">
                      {book.writer}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturedBooks;