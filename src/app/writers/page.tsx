'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import WriterCardOptimized from '@/components/WriterCardOptimized';
import api from '@/utils/api';
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

// Define floating animations for decorative elements
const floatingStyles = `
@keyframes gentle-pulse {
  0% { opacity: 0.06; }
  50% { opacity: 0.12; }
  100% { opacity: 0.06; }
}

@keyframes gentle-fade {
  0% { opacity: 0.4; }
  50% { opacity: 0.6; }
  100% { opacity: 0.4; }
}

@keyframes tiny-float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}

@keyframes tiny-sway {
  0% { transform: translateX(0); }
  50% { transform: translateX(2px); }
  100% { transform: translateX(0); }
}

.animate-gentle-pulse {
  animation: gentle-pulse 8s ease-in-out infinite;
}

.animate-gentle-fade {
  animation: gentle-fade 6s ease-in-out infinite;
}

.animate-tiny-float {
  animation: tiny-float 6s ease-in-out infinite;
}

.animate-tiny-sway {
  animation: tiny-sway 7s ease-in-out infinite;
}

.animate-reduced-motion {
  animation-duration: 10s;
}
`;

// Define the User type with articles/isWriter flag
interface User {
  _id: string;
  name: string;
  username: string;
  profileImage: string;
  bio: string;
  isWriter: boolean;
  articles: any[];
  followers: any[];
}

export default function WritersPage() {
  const [writers, setWriters] = useState<User[]>([]);
  const [filteredWriters, setFilteredWriters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add the animation styles to the document
  useEffect(() => {
    // Create a style element for the floating animations
    const animationStyle = document.createElement('style');
    // Add the floating animations CSS
    animationStyle.textContent = floatingStyles;
    // Append to the document head
    document.head.appendChild(animationStyle);

    // Clean up on component unmount
    return () => {
      document.head.removeChild(animationStyle);
    };
  }, []);

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        setLoading(true);
        
        // Use the API utility with a 5-minute cache duration for this specific endpoint
        // This ensures we don't make redundant calls when navigating back to this page
        const data = await api.get('/api/users?isWriter=true&limit=16', {}, {
          useCache: true,
          cacheDuration: 5 * 60 * 1000 // 5 minutes
        });
        
        if (data.success) {
          // Sort writers by number of articles (high to low)
          const sortedWriters = [...data.users].sort((a, b) => 
            (b.articles?.length || 0) - (a.articles?.length || 0)
          );
          setWriters(sortedWriters);
          setFilteredWriters(sortedWriters);
        } else {
          throw new Error(data.message || 'Failed to fetch writers');
        }
      } catch (error) {
        console.error('Error fetching writers:', error);
        setError('Failed to load writers. Please try again later.');
        
        // Show fallback writers if API call fails
        const fallbackWriters = [
          {
            _id: '1',
            name: 'ئازاد کەریم',
            username: 'azad',
            profileImage: '/author-default.jpg',
            bio: 'نووسەر و ڕۆژنامەنووس',
            isWriter: true,
            articles: new Array(5),
            followers: new Array(23)
          },
          {
            _id: '2',
            name: 'زارا عوسمان',
            username: 'zara',
            profileImage: '/author-default.jpg',
            bio: 'نووسەر و وەرگێڕ',
            isWriter: true,
            articles: new Array(3),
            followers: new Array(12)
          }
        ];
        setWriters(fallbackWriters);
        setFilteredWriters(fallbackWriters);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWriters();
    
    // Cleanup function
    return () => {
      // No cleanup needed, the cache will persist but we don't need to clear it
    };
  }, []);

  // Filter writers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredWriters(writers);
      setIsSearching(false);
    } else {
      setIsSearching(true);
      const filtered = writers.filter(writer => 
        writer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWriters(filtered);
      setIsSearching(false);
    }
  }, [searchTerm, writers]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim() !== '') {
      setIsSearching(true);
    }
  };

  // Clear search function
  const clearSearch = () => {
    setSearchTerm('');
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // No need for separate API call since we're filtering locally
    setIsSearching(false);
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Elegant header with minimalist design */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-gray-800 relative inline-block">
            <span className="relative z-10">نووسەرانی پلاتفۆرم</span>
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] rounded-full"></span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12 md:text-lg">
            بەکارهێنەران کە وتاریان بڵاوکردۆتەوە لە پلاتفۆرمەکەمان. دوای بکەون و بەرهەمە داهێنەرانەکانیان بخوێننەوە.
          </p>

          {/* Enhanced search bar with animations */}
          <div className="max-w-2xl mx-auto mb-10 relative">
            {/* Left decoration */}
            <div className="absolute -top-4 -left-4 text-[var(--primary)] opacity-60 animate-gentle-fade animate-tiny-sway">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Search icon decoration */}
            <div className="absolute -top-2 right-8 text-[var(--primary-light)] opacity-50 animate-gentle-fade animate-reduced-motion">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M8.25 10.875a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.125 4.5a4.125 4.125 0 102.338 7.524l2.007 2.006a.75.75 0 101.06-1.06l-2.006-2.007a4.125 4.125 0 00-3.399-6.463z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Small document icon */}
            <div className="absolute -bottom-4 -right-6 text-[var(--primary-light)] opacity-40 animate-gentle-pulse animate-reduced-motion">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
              </svg>
            </div>
            
            <form 
              onSubmit={handleSearch} 
              className="relative"
              role="search"
              aria-label="Search writers"
            >
              <div className="relative group">
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="گەڕان بەدوای نووسەران..."
                  className={`w-full px-5 py-3.5 rounded-full 
                    ${searchTerm 
                      ? 'border-[var(--primary)] border-2 bg-white/50 backdrop-blur-md' 
                      : 'border-[#e5e7eb] border group-hover:border-[var(--primary-light)] bg-white/40 backdrop-blur-md'
                    } 
                    focus:border-[var(--primary)] focus:border-2
                    focus:outline-none transition-all duration-200 ease-in-out
                    text-gray-800 placeholder-gray-500 pr-12`}
                  style={{ direction: 'rtl' }}
                  aria-label="Search writers"
                  onKeyDown={(e) => {
                    // Clear on Escape key
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      clearSearch();
                    }
                  }}
                />
                {/* Search icon on the right side */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--primary)] pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[var(--primary)] transition-colors"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              {isSearching && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm text-gray-600">گەڕان...</span>
                </div>
              )}
            </form>
          </div>
          
          {/* Active search filter display - only show when searching */}
          {searchTerm && filteredWriters.length > 0 && !isSearching && (
            <div className="max-w-md mx-auto -mt-6 mb-8">
              <div className="flex items-center justify-center">
                <div className="bg-[#eff6ff]/40 backdrop-blur-md border border-[var(--primary-light)]/50 text-[var(--primary-dark)] px-4 py-1.5 rounded-full text-sm font-medium flex items-center">
                  <span className="mr-1">گەڕان بۆ:</span> {searchTerm}
                  <button 
                    onClick={clearSearch}
                    className="ml-2 p-0.5 text-[var(--primary)] hover:text-[var(--primary-dark)] hover:bg-[#dbeafe]/40 rounded-full transition-all"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content section */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--grey-dark)]">بارکردنی نووسەران...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg text-center text-red-800">{error}</div>
        ) : filteredWriters.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-5-5 5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5" />
            </svg>
            <p className="text-xl text-[var(--grey-dark)] mb-4">هیچ نووسەرێک نەدۆزرایەوە بەم ناوە</p>
            <button 
              onClick={clearSearch}
              className="mt-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-md hover:shadow-lg"
            >
              پیشاندانی هەموو نووسەران
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <p className="text-gray-600">
                <span className="font-semibold text-[var(--primary)]">{filteredWriters.length}</span> نووسەر
              </p>
              {searchTerm && (
                <p className="text-gray-600 bg-gray-100 px-4 py-1 rounded-full">
                  گەڕان: <span className="font-semibold text-[var(--primary)]">{searchTerm}</span>
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWriters.map((writer) => (
                <WriterCardOptimized key={writer._id} writer={{
                  id: writer._id,
                  name: writer.name,
                  bio: writer.bio || "بەکارهێنەر لە پلاتفۆرمی بنووسە",
                  avatar: writer.profileImage || '',
                  articlesCount: writer.articles?.length || 0,
                  followers: writer.followers?.length || 0,
                  username: writer.username
                }} />
              ))}
            </div>
          </>
        )}

        {/* Join as Writer CTA */}
        <div className="mt-20 bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary-light)]/20 text-[var(--primary)] mb-6">
              <PencilSquareIcon className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4">ببە بە نووسەر</h2>
            <p className="text-[var(--grey-dark)] max-w-2xl mx-auto mb-6">
              زانیاری و پسپۆڕییەکانت بەشداری بکە لەگەڵ کۆمەڵگە گەشەسەندووەکەمان. ببە بە نووسەر لە پلاتفۆڕمی بنووسە و یارمەتیدەر بە
              لە بنیاتنانی گەورەترین کۆگای نووسینەکی زمانی کوردی.
            </p>
            <Link 
              href="/write-here" 
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors shadow-md hover:shadow-lg"
            >
              <span>داواکاری وەک نووسەر</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary-light)]/10 rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--primary-light)]/10 rounded-tr-full"></div>
        </div>
      </div>
    </div>
  );
} 