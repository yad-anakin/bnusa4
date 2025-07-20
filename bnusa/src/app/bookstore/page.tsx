'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/utils/api';

// Book interface
interface Book {
  _id: string;
  id?: string;
  title: string;
  writer: string;
  language: string;
  genre: string;
  year: number;
  pages: number;
  description: string;
  publisher: string;
  image: string;
  downloadLink: string;
  format: string;
  size: string;
  rating: number;
  downloads: number;
  slug: string; // Added slug to the interface
}

// Pagination interface
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Kurdish to English mapping for genres
const genreMapping: Record<string, string> = {
  'هەموو': 'all',
  'ڕۆمان': 'novel',
  'شێعر': 'poetry',
  'زانستی': 'science',
  'مێژوویی': 'history',
  'ئایینی': 'religion',
  'فەلسەفە': 'philosophy',
  'کۆمەڵناسی': 'sociology'
};

// Kurdish to English mapping for languages
const languageMapping: Record<string, string> = {
  'هەموو': 'all',
  'کوردی': 'kurdish',
  'عەرەبی': 'arabic',
  'ئینگلیزی': 'english',
  'فارسی': 'persian',
  'تورکی': 'turkish'
};

const genres = ['هەموو', 'ڕۆمان', 'شێعر', 'زانستی', 'مێژوویی', 'ئایینی', 'فەلسەفە', 'کۆمەڵناسی'];
const years = ['هەموو', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const languages = ['هەموو', 'کوردی', 'عەرەبی', 'ئینگلیزی', 'فارسی', 'تورکی'];

export default function Bookstore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('هەموو');
  const [selectedYear, setSelectedYear] = useState('هەموو');
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic filter options from API
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // English to Kurdish mapping for display purposes
  const englishToKurdishGenre: Record<string, string> = Object.entries(genreMapping).reduce(
    (acc, [key, value]) => ({ ...acc, [value]: key }), 
    {}
  );
  
  const englishToKurdishLanguage: Record<string, string> = Object.entries(languageMapping).reduce(
    (acc, [key, value]) => ({ ...acc, [value]: key }), 
    {}
  );

  // Debounce search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 100); // Reduced from 300ms to 100ms for faster response
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch books from API
  useEffect(() => {
    async function fetchBooks() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Construct query params
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString()
        });
        
        if (debouncedSearchQuery) {
          params.append('search', debouncedSearchQuery);
        }
        
        // Convert Kurdish genre to English for API
        if (selectedGenre !== 'هەموو') {
          const englishGenre = genreMapping[selectedGenre] || selectedGenre;
          params.append('genre', englishGenre);
        }
        
        if (selectedYear !== 'هەموو') {
          params.append('year', selectedYear);
        }
        
        // Fetch books using the secure API utility
        const data = await api.get(`/api/books?${params.toString()}`);
        
        if (data.success) {
          setBooks(data.books || []);
          setPagination(data.pagination || pagination);
          
          // Store available filter options
          if (data.filters) {
            if (data.filters.genres) setAvailableGenres(data.filters.genres);
            if (data.filters.years) setAvailableYears(data.filters.years);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch books');
        }
      } catch (err: any) {
        console.error('Error fetching books:', err);
        setError(err.message || 'An error occurred while fetching books');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBooks();
  }, [pagination.page, debouncedSearchQuery, selectedGenre, selectedYear]);

  // Handle filter changes
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(e.target.value);
    // Reset to first page when filter changes
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 px-4 mx-auto">
            <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-100 bg-clip-text text-transparent inline-block py-1">
              کتێبخانەی بنووسە
            </span>
          </h1>
          <p className="text-[var(--grey-dark)] text-lg max-w-2xl mx-auto">
            کۆمەڵێک کتێبی PDF کە لە ڕێگەی تۆڕە کۆمەڵایەتییەکانمان کۆکراونەتەوە
          </p>
          {pagination.total > 0 && (
            <div className="mt-4 inline-block bg-[var(--primary)]/10 px-4 py-2 rounded-full text-[var(--primary)] font-semibold">
              کۆی کتێبەکان: {pagination.total}
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input
              type="text"
              placeholder="گەڕان بۆ کتێب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50 text-lg"
            />
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]"
              onClick={() => setDebouncedSearchQuery(searchQuery)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <select
            value={selectedGenre}
            onChange={handleGenreChange}
            className="px-6 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50"
          >
            <option value="هەموو">هەموو جۆرەکان</option>
            {availableGenres.map((genre) => {
              // Convert English genre to Kurdish for display
              const kurdishGenre = englishToKurdishGenre[genre.toLowerCase()] || genre;
              return (
                <option key={genre} value={kurdishGenre}>
                  {kurdishGenre}
                </option>
              );
            })}
          </select>
          
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="px-6 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50"
          >
            <option value="هەموو">هەموو ساڵەکان</option>
            {availableYears.sort((a, b) => b - a).map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="text-center">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ کتێبێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <>
            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {books.map((book, idx) => (
                <Link href={`/bookstore/${book.id}`} key={book._id}>
                  <div className="group relative bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-[var(--primary)]/50 transition-colors duration-300">
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={book.image}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        priority={idx === 0}
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
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.page <= 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 backdrop-blur-md text-[var(--primary)] hover:bg-white/20'
                    }`}
                  >
                    &laquo; پێشوو
                  </button>
                  
                  {[...Array(pagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Only show a window of pages around the current page
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg ${
                            pagination.page === pageNum
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-white/10 backdrop-blur-md text-[var(--primary)] hover:bg-white/20'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    
                    // Add ellipsis for skipped pages
                    if (
                      (pageNum === 2 && pagination.page > 4) ||
                      (pageNum === pagination.pages - 1 && pagination.page < pagination.pages - 3)
                    ) {
                      return <span key={pageNum} className="px-3 py-2">...</span>;
                    }
                    
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.page >= pagination.pages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 backdrop-blur-md text-[var(--primary)] hover:bg-white/20'
                    }`}
                  >
                    داهاتوو &raquo;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 