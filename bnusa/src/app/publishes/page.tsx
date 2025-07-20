'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ArticleCard from '@/components/ArticleCard';
import api from '@/utils/api';

// Define CSS animations for floating elements
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

// Define the Article type
interface Author {
  name: string;
  username?: string;
  profileImage?: string;
  isWriter?: boolean;
}

interface Article {
  _id: string;
  title: string;
  description: string;
  author: Author;
  slug: string;
  categories: string[];
  status?: string;
  coverImage?: string;
}

// Categories with icons and colors
const categories = [
  {name: 'هەموو', icon: 'hashtag', color: 'bg-gray-600'},
  {name: 'زانست', icon: 'beaker', color: 'bg-blue-500'},
  {name: 'مێژوو', icon: 'clock', color: 'bg-amber-600'},
  {name: 'هونەر', icon: 'paint-brush', color: 'bg-pink-500'},
  {name: 'فەلسەفە', icon: 'lightbulb', color: 'bg-violet-600'},
  {name: 'تەکنەلۆژیا', icon: 'device-mobile', color: 'bg-teal-500'},
  {name: 'ئەدەب', icon: 'book', color: 'bg-emerald-500'},
  {name: 'سیاسەت', icon: 'scale', color: 'bg-red-500'},
  {name: 'ئابووری', icon: 'chart-line', color: 'bg-green-600'},
  {name: 'تەندروستی', icon: 'heart', color: 'bg-rose-500'},
  {name: 'وەرزش', icon: 'flame', color: 'bg-orange-500'},
  {name: 'ژینگە', icon: 'globe', color: 'bg-cyan-600'},
  {name: 'گەشتیاری', icon: 'map', color: 'bg-fuchsia-500'},
];

export default function PublishesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('هەموو');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const articlesPerPage = 9; // Show exactly 9 articles per page
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Add totalCount state to track total number of articles
  const [totalCount, setTotalCount] = useState(0);
  // Add state for real total count from API
  const [realTotalCount, setRealTotalCount] = useState(0);

  // Add a style tag to hide scrollbars across browsers
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    // Add CSS rules to hide scrollbars
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;  /* Chrome, Safari and Opera */
      }
    `;
    // Append the style element to the document head
    document.head.appendChild(style);

    // Clean up on component unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Debounce search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 100); // Reduced from 300ms to 100ms for faster response
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    // Reset to page 1 when category changes
    setCurrentPage(1);
    // Clear search when category changes
    if (searchQuery) {
      setSearchQuery('');
      setIsSearching(false);
      setShowNoResults(false);
    }
    fetchArticles(1);
    
    // Clean up any pending search timeout
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [activeCategory]);

  // Fetch articles when page or search query changes
  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage, debouncedSearchQuery]);

  const fetchArticles = async (page: number) => {
    try {
      setLoading(true);
      setShowNoResults(false);
      
      // Add category filter if not 'All'
      const categoryParam = activeCategory !== 'هەموو' ? `&category=${activeCategory}` : '';
      
      // Only add search parameter if it's a non-empty search
      const searchParam = debouncedSearchQuery.trim() ? `&search=${encodeURIComponent(debouncedSearchQuery.trim())}` : '';
      
      // Use pagination parameters: limit and page
      const apiUrl = `/api/articles?limit=${articlesPerPage}&page=${page}${categoryParam}${searchParam}`;
      
      // Use noCache variant to avoid any caching issues
      const data = await api.noCache.get(apiUrl);
      
      if (data.success) {
        // Sort articles by slug as a number (newest slug first)
        const sortedArticles = (data.articles || []).sort((a: any, b: any) => {
          const slugA = parseInt(a.slug, 10);
          const slugB = parseInt(b.slug, 10);
          // If either slug is not a number, treat it as lower priority
          if (isNaN(slugA) && isNaN(slugB)) return 0;
          if (isNaN(slugA)) return 1;
          if (isNaN(slugB)) return -1;
          return slugB - slugA;
        });
        setArticles(sortedArticles);
        
        // If we were searching and got no results, show the no results message
        if (debouncedSearchQuery.trim() && data.articles?.length === 0) {
          setShowNoResults(true);
          // Set total count to 0 when no results are found
          setTotalCount(0);
          setRealTotalCount(0);
          setTotalPages(1);
        } else {
          setShowNoResults(false);
          
          // Set the total count from the API response (or calculate from total pages if not provided)
          if (data.totalCount !== undefined) {
            setTotalCount(data.totalCount);
            // Calculate total pages based on total count
            const calculatedTotalPages = Math.ceil(data.totalCount / articlesPerPage);
            setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
          } else if (data.totalPages !== undefined) {
            setTotalPages(data.totalPages);
            // Estimate total count if only total pages is provided
            setTotalCount(data.totalPages * articlesPerPage);
          } else {
            // Fallback to current page count if no pagination info is provided
            setTotalCount(data.articles?.length || 0);
            setTotalPages(1);
          }
          
          // Set the realTotalCount as well to match FeaturedArticles component
          setRealTotalCount(data.totalCount || data.total || totalCount);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch articles');
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
      setArticles([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setIsSearching(false);
      // Scroll to top of the page when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (category: string) => {
    // Set new active category
    setActiveCategory(category);
    
    // Clear search when changing categories
    setSearchQuery('');
    setIsSearching(true);
    setShowNoResults(false);
    setCurrentPage(1);
    
    // Will fetch articles in the useEffect triggered by activeCategory change
  };

  const handlePageChange = (page: number) => {
    // If trying to navigate to the same page, do nothing
    if (page === currentPage) return;
    
    // If the page is valid (not out of bounds)
    if (page > 0 && page <= totalPages) {
      // Update the current page state which will trigger the useEffect to fetch articles
      setCurrentPage(page);
      // No scroll here - we'll handle it in fetchArticles
    }
  };

  const clearSearch = () => {
    // Reset search state
    setSearchQuery('');
    setIsSearching(true);
    setShowNoResults(false);
    setCurrentPage(1);
    
    // Always fetch the default articles when clearing search
    fetchArticles(1);
    
    // Re-fetch the total count to ensure it's accurate after clearing the search
    fetchTotalCount();
    
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Function to render the appropriate icon for each category
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'hashtag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-.542 2.163a1 1 0 11-1.94-.486L12.03 8H9.09l-.542 2.163a1 1 0 11-1.94-.486L7.07 8H5a1 1 0 010-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.09 8l.54-2.163.53-2.128L10.145 4 9.09 8zm3.48 0l.54-2.163.53-2.128L13.634 4 12.57 8H9.09z" clipRule="evenodd" />
          </svg>
        );
      case 'beaker':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
          </svg>
        );
      case 'clock':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 002 0V6z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 002 0V6z" clipRule="evenodd" />
          </svg>
        );
      case 'paint-brush':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 1h6a1 1 0 0 1 1 1v4h6a1 1 0 0 1 1 1v6a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V2a1 1 0 0 1 1-1zm1 3a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H5z" />
          </svg>
        );
      case 'lightbulb':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        );
      case 'device-mobile':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'book':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'scale':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
          </svg>
        );
      case 'chart-line':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'heart':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        );
      case 'flame':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
      case 'globe':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
          </svg>
        );
      case 'map':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // New pagination component
  const renderPagination = () => {
    if (totalPages <= 1 || showNoResults) return null;
    
    const MAX_VISIBLE_PAGES = 5;
    const pageButtons = [];
    
    // Calculate range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
    
    // Adjust if we're at the end of the range
    if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }
    
    // Add previous button
    pageButtons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center w-10 h-10 rounded-full 
          ${currentPage === 1 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-[#3b82f6] hover:bg-[#eff6ff]/60'
        }`}
        aria-label="Previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
    
    // Add first page if not in range
    if (startPage > 1) {
      pageButtons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="flex items-center justify-center w-10 h-10 rounded-full text-[#3b82f6] hover:bg-[#eff6ff]/60"
        >
          1
        </button>
      );
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pageButtons.push(
          <span key="ellipsis1" className="flex items-center justify-center w-10 h-10">
            ...
          </span>
        );
      }
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`flex items-center justify-center w-10 h-10 rounded-full font-medium
            ${currentPage === i 
              ? 'bg-[#3b82f6] text-white shadow-sm' 
              : 'text-[#3b82f6] hover:bg-[#eff6ff]/60'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add last page if not in range
    if (endPage < totalPages) {
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageButtons.push(
          <span key="ellipsis2" className="flex items-center justify-center w-10 h-10">
            ...
          </span>
        );
      }
      
      pageButtons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="flex items-center justify-center w-10 h-10 rounded-full text-[#3b82f6] hover:bg-[#eff6ff]/60"
        >
          {totalPages}
        </button>
      );
    }
    
    // Add next button
    pageButtons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center w-10 h-10 rounded-full 
          ${currentPage === totalPages 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-[#3b82f6] hover:bg-[#eff6ff]/60'
        }`}
        aria-label="Next page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
    
    return (
      <div className="flex items-center justify-center gap-1 mt-12">
        <div className="inline-flex items-center rounded-full bg-white/40 backdrop-blur-md p-2 border border-[#dbeafe]/30">
          {pageButtons}
        </div>
        <div className="text-sm text-gray-500 mr-4">
          {articlesPerPage * (currentPage - 1) + 1}-{Math.min(articlesPerPage * currentPage, realTotalCount)} لە {realTotalCount} وتار
        </div>
      </div>
    );
  };

  // Add clear visual feedback when search is active
  useEffect(() => {
    // When search query changes, update the document title to reflect search state
    if (searchQuery) {
      document.title = `گەڕان بۆ: ${searchQuery} | bnusa`;
    } else {
      document.title = 'بڵاوکراوەکان | bnusa';
    }
    
    // If the search query was completely cleared (not just when component loads)
    if (searchQuery === '' && !loading) {
      // We don't need to fetch again here, as handleSearchInputChange handles it
    }
  }, [searchQuery, loading]);

  // Clear search when unmounting 
  useEffect(() => {
    return () => {
      // Reset document title when component unmounts
      document.title = 'bnusa';
      
      // Clear any pending search timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  // Function to fetch total article count
  const fetchTotalCount = async () => {
    try {
      // Make a dedicated API call to get accurate total count
      const data = await api.noCache.get('/api/articles?countOnly=true');
      if (data.success) {
        // Try different property names the API might return for the total count
        const totalArticles = data.totalCount || data.total || data.count || 0;
        setRealTotalCount(totalArticles);
      }
    } catch (err) {
      console.error('Error fetching total article count:', err);
    }
  };

  // Fetch total article count on component mount
  useEffect(() => {
    fetchTotalCount();
  }, []);

  // Helper function to convert Tailwind color classes to CSS colors
  const getBorderColor = (colorClass: string): string => {
    switch (colorClass) {
      case 'bg-gray-600': return '#4b5563';
      case 'bg-blue-500': return '#3b82f6';
      case 'bg-amber-600': return '#d97706';
      case 'bg-pink-500': return '#ec4899';
      case 'bg-violet-600': return '#7c3aed';
      case 'bg-teal-500': return '#14b8a6';
      case 'bg-emerald-500': return '#10b981';
      case 'bg-red-500': return '#ef4444';
      case 'bg-green-600': return '#16a34a';
      case 'bg-rose-500': return '#f43f5e';
      case 'bg-orange-500': return '#f97316';
      case 'bg-cyan-600': return '#0891b2';
      case 'bg-fuchsia-500': return '#d946ef';
      default: return '#3b82f6'; // Default to blue
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 px-4 mx-auto">
            <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-100 bg-clip-text text-transparent inline-block py-1">
              بڵاوکراوەکان 
            </span>
          </h1>
          <p className="text-[var(--grey-dark)] text-lg max-w-2xl mx-auto">
           کۆمەڵێک بڵاوکراوە کە لەلایەن نووسەرانی پلاتفۆرمی بنووسەوە نووسراون
          </p>
          {realTotalCount > 0 && !showNoResults && (
            <div className="mt-4 inline-block bg-[var(--primary)]/10 px-4 py-2 rounded-full text-[var(--primary)] font-semibold">
              کۆی وتارەکان: {realTotalCount}
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input
              type="text"
              placeholder="گەڕان بۆ وتارەکان..."
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

        {/* Active filters display - only show after searching */}
        {searchQuery && articles.length > 0 && !isSearching && (
          <div className="max-w-2xl mx-auto -mt-6 mb-8">
            <div className="flex items-center justify-center">
              <div className="bg-[var(--primary)]/10 px-4 py-2 rounded-full text-[var(--primary)] font-medium flex items-center">
                <span className="mr-1">گەڕان بۆ:</span> {searchQuery}
                <button 
                  onClick={clearSearch}
                  className="ml-2 p-0.5 text-[var(--primary)] hover:text-[var(--primary-dark)] rounded-full transition-all"
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
        
        {/* Categories */}
        <div className="mb-10 relative p-4">
          <div className="flex justify-center items-center relative">
            {/* Left scroll button */}
            <div className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={scrollLeft}
                className="bg-white/80 backdrop-blur-md rounded-full p-2 text-[var(--primary)] hover:text-[var(--primary-dark)] hover:shadow-sm transition-all ml-1 border border-[var(--grey-light)]/50"
                aria-label="Scroll left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Right scroll button */}
            <div className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={scrollRight}
                className="bg-white/80 backdrop-blur-md rounded-full p-2 text-[var(--primary)] hover:text-[var(--primary-dark)] hover:shadow-sm transition-all mr-1 border border-[var(--grey-light)]/50"
                aria-label="Scroll right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Scrollable categories */}
            <div 
              ref={scrollRef}
              className="flex space-x-2 overflow-x-auto scrollbar-hide px-8 md:px-0 md:flex-wrap md:justify-center gap-2 py-2"
            >
              {categories.map((category) => (
                <button
                  key={category.name}
                  className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                    category.name === activeCategory
                      ? `bg-[var(--primary)]/10 border border-[var(--primary)]/50 text-[var(--primary)] font-medium` 
                      : 'border border-white/20 bg-white/10 backdrop-blur-md text-gray-700 hover:border-[var(--primary)]/50'
                  }`}
                  onClick={() => handleCategoryChange(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="text-center">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : showNoResults ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ وتارێک نەدۆزرایەوە بۆ "{searchQuery}"</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ وتارێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <>
            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, idx) => (
                <div key={article._id} className="transform transition-all duration-300 hover:-translate-y-1">
                  <ArticleCard
                    title={article.title}
                    description={article.description}
                    author={article.author}
                    slug={article.slug}
                    categories={article.categories}
                    status={article.status}
                    coverImage={article.coverImage}
                  />
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
} 
