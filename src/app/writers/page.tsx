'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import WriterCardOptimized from '@/components/WriterCardOptimized';
import api from '@/utils/api';
import { MagnifyingGlassIcon, PencilSquareIcon, AdjustmentsHorizontalIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

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

// Define the User type with roles flags
interface User {
  _id: string;
  name: string;
  username: string;
  profileImage: string;
  bio: string;
  isWriter: boolean | string;
  isSupervisor: boolean | string;
  isDesigner: boolean | string;
  articles: any[];
  followers: any[];
  designsCount?: number; // For designers
  writingCount?: number; // For supervisors (deprecated)
  supervisorText?: string; // For supervisors
}

export default function StaffPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'writers' | 'supervisors' | 'designers'>('writers');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8; // Show 8 users per page
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

  // Fetch all users on component mount
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        console.log('Fetching all users...');
        
        // Use the API utility to fetch all users with no cache
        // We'll fetch all users without role filtering to populate all tabs
        const data = await api.get('/api/users?limit=100', {}, {
          useCache: false,
          cacheDuration: 0
        });
        
        console.log('API response:', data);
        
        if (data.success) {
          let users = data.users || [];
          console.log(`Fetched ${users.length} users`);
          
          // Ensure all users have the required role properties
          users = users.map((user: any) => ({
            ...user,
            isWriter: user.isWriter || false,
            isSupervisor: user.isSupervisor || false,
            isDesigner: user.isDesigner || false
          }));
          
          // Log detailed information about all users
          console.log('All users with roles:');
          users.forEach((user: User) => {
            console.log(`User ${user.name} (${user.username}): ` +
              `isWriter=${user.isWriter} (${typeof user.isWriter}), ` +
              `isSupervisor=${user.isSupervisor} (${typeof user.isSupervisor}), ` + 
              `isDesigner=${user.isDesigner} (${typeof user.isDesigner})`);
          });
          
          // Test the isTruthy function on each user role
          console.log('Testing isTruthy function:');
          users.forEach((user: User) => {
            console.log(`User ${user.name}: ` +
              `isWriter=${isTruthy(user.isWriter)}, ` +
              `isSupervisor=${isTruthy(user.isSupervisor)}, ` + 
              `isDesigner=${isTruthy(user.isDesigner)}`);
          });
          
          // Count users by role using the isTruthy function
          const writersCount = users.filter((u: User) => isTruthy(u.isWriter)).length;
          const supervisorsCount = users.filter((u: User) => isTruthy(u.isSupervisor)).length;
          const designersCount = users.filter((u: User) => isTruthy(u.isDesigner)).length;
          
          console.log(`Role counts using isTruthy: Writers=${writersCount}, Supervisors=${supervisorsCount}, Designers=${designersCount}`);
          
          setAllUsers(users);
        } else {
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again later.');
        
        // Set fallback data with users for all tabs
        setAllUsers([
          {
            _id: '1',
            name: 'ئازاد کەریم',
            username: 'azad',
            profileImage: '/author-default.jpg',
            bio: 'نووسەر و ڕۆژنامەنووس',
            isWriter: true,
            isSupervisor: false,
            isDesigner: false,
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
            isSupervisor: false,
            isDesigner: false,
            articles: new Array(3),
            followers: new Array(12)
          },
          {
            _id: '3',
            name: 'هێمن محەمەد',
            username: 'hemen',
            profileImage: '/author-default.jpg',
            bio: 'سەرپەرشتیار لە پلاتفۆرمی بنووسە',
            isWriter: false,
            isSupervisor: true,
            isDesigner: false,
            articles: new Array(0),
            followers: new Array(8),
            supervisorText: 'بەشی وتار و چیرۆک'
          },
          {
            _id: '4',
            name: 'شادان عەلی',
            username: 'shadan',
            profileImage: '/author-default.jpg',
            bio: 'دیزاینەر لە پلاتفۆرمی بنووسە',
            isWriter: false,
            isSupervisor: false,
            isDesigner: true,
            articles: new Array(0),
            followers: new Array(15),
            designsCount: 12
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllUsers();
  }, []);

  // Filter users based on active tab and search term
  const filteredUsers = allUsers.filter(user => {
    // First filter by role
    if (activeTab === 'writers' && !isTruthy(user.isWriter)) return false;
    if (activeTab === 'supervisors' && !isTruthy(user.isSupervisor)) return false;
    if (activeTab === 'designers' && !isTruthy(user.isDesigner)) return false;
    
    // Then filter by search term if present
    if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Calculate pagination values
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers
    .sort((a, b) => {
      if (activeTab === 'writers') {
        return (b.articles?.length || 0) - (a.articles?.length || 0);
      } else if (activeTab === 'designers') {
        return (b.designsCount || 0) - (a.designsCount || 0);
      }
      return 0;
    })
    .slice(indexOfFirstUser, indexOfLastUser);
    
  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to check if a value is truthy
  function isTruthy(value: any): boolean {
    if (value === undefined || value === null) return false;
    
    if (typeof value === 'string') {
      const lowercaseValue = value.toLowerCase();
      return lowercaseValue === 'true' || lowercaseValue === '1' || lowercaseValue === 'yes';
    }
    
    if (typeof value === 'number') {
      return value === 1;
    }
    
    return Boolean(value);
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear search function
  const clearSearch = () => {
    setSearchTerm('');
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Get the correct title and count for the active tab
  const getActiveTabInfo = () => {
    switch (activeTab) {
      case 'writers':
        return {
          title: 'نووسەرەکان',
          count: filteredUsers.length,
          icon: <PencilSquareIcon className="h-6 w-6 text-blue-600" />
        };
      case 'supervisors':
        return {
          title: 'سەرپەرشتیارەکان',
          count: filteredUsers.length,
          icon: <AdjustmentsHorizontalIcon className="h-6 w-6 text-green-600" />
        };
      case 'designers':
        return {
          title: 'دیزاینەرەکان',
          count: filteredUsers.length,
          icon: <PaintBrushIcon className="h-6 w-6 text-purple-600" />
        };
      default:
        return {
          title: 'ستافی پلاتفۆرم',
          count: filteredUsers.length,
          icon: <PencilSquareIcon className="h-6 w-6 text-blue-600" />
        };
    }
  };

  const { title, count, icon } = getActiveTabInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5 relative">
      {/* Background light effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl max-h-5xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 px-4 mx-auto">
            <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-100 bg-clip-text text-transparent inline-block py-1">
              ستافی پلاتفۆرم
            </span>
          </h1>
          <p className="text-[var(--grey-dark)] text-lg max-w-2xl mx-auto">
             پڕۆفایلی ستافی بنووسە لە نووسەران، سەرپەرشتیار و دیزاینەران. 
          </p>
        </div>
            
        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-md shadow-sm bg-white/20 backdrop-blur-md p-1">
            <button
              onClick={() => {
                setActiveTab('writers');
                setCurrentPage(1); // Reset to first page when changing tabs
              }}
              className={`px-6 py-3 text-sm font-medium rounded-md flex items-center ${
                activeTab === 'writers'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PencilSquareIcon className={`h-5 w-5 ${activeTab === 'writers' ? 'text-blue-600' : 'text-gray-400'} mr-2`} />
             نووسەرەکان            </button>
            <button
              onClick={() => {
                setActiveTab('supervisors');
                setCurrentPage(1); // Reset to first page when changing tabs
              }}
              className={`px-6 py-3 text-sm font-medium rounded-md flex items-center ${
                activeTab === 'supervisors'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AdjustmentsHorizontalIcon className={`h-5 w-5 ${activeTab === 'supervisors' ? 'text-green-600' : 'text-gray-400'} mr-2`} />
              سەرپەرشتیارەکان
            </button>
            <button
              onClick={() => {
                setActiveTab('designers');
                setCurrentPage(1); // Reset to first page when changing tabs
              }}
              className={`px-6 py-3 text-sm font-medium rounded-md flex items-center ${
                activeTab === 'designers'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PaintBrushIcon className={`h-5 w-5 ${activeTab === 'designers' ? 'text-purple-600' : 'text-gray-400'} mr-2`} />
              دیزاینەرەکان
            </button>
          </div>
            </div>
            
        {/* Section Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center bg-white/30 backdrop-blur-md px-6 py-3 rounded-full shadow-sm">
            {icon}
            <h2 className="text-2xl font-bold mx-3">{title}</h2>
            <div className="bg-[var(--primary)]/10 px-3 py-1 rounded-full text-[var(--primary)] font-semibold">
              {count}
            </div>
          </div>
            </div>
            
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
              <div className="relative group">
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={handleSearchChange}
              placeholder={`گەڕان بەدوای ${title}...`}
              className="w-full px-6 py-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50 text-lg"
                  style={{ direction: 'rtl' }}
              aria-label="Search staff"
                  onKeyDown={(e) => {
                    // Clear on Escape key
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      clearSearch();
                    }
                  }}
                />
                  <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]"
              onClick={() => setSearchTerm(searchInputRef.current?.value || '')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
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
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ ستافێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <>
            {/* Pagination summary */}
            <div className="text-center mb-6 text-gray-600">
              <p>
                نیشاندانی {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} لە کۆی {filteredUsers.length} {activeTab === 'writers' ? 'ستاف' : activeTab === 'supervisors' ? 'سەرپەرشتیار' : 'دیزاینەر'}
              </p>
            </div>
            
            {/* Staff Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentUsers.map((staff, index) => {
                // Determine rank (only for top 3) - but not for supervisors
                // Note: We use index + indexOfFirstUser to ensure correct ranking across pages
                const globalIndex = index + indexOfFirstUser;
                const rank = (activeTab !== 'supervisors' && globalIndex < 3) ? 
                  (globalIndex + 1) as 1 | 2 | 3 : undefined;
                
                return (
                  <WriterCardOptimized 
                    key={staff._id} 
                    writer={{
                      id: staff._id,
                      name: staff.name,
                      bio: staff.bio || "بەکارهێنەر لە پلاتفۆرمی بنووسە",
                      avatar: staff.profileImage || '',
                      articlesCount: staff.articles?.length || 0,
                      followers: staff.followers?.length || 0,
                      username: staff.username,
                      role: activeTab === 'supervisors' ? 'supervisor' : 
                            activeTab === 'designers' ? 'designer' : 'writer',
                      designsCount: staff.designsCount || 0, // Always pass designsCount regardless of role
                      supervisorText: activeTab === 'supervisors' ? (staff.supervisorText || '') : undefined
                    }}
                    rank={rank}
                  />
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="inline-flex rounded-md shadow-sm bg-white/30 backdrop-blur-md p-1">
                  {/* Previous Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-md flex items-center mr-1
                      ${currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-white/50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    پێشوو
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // If near start, show first 5
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If near end, show last 5
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Otherwise show current and 2 on each side
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 text-sm font-medium rounded-md mx-0.5
                            ${currentPage === pageNum
                              ? 'bg-[var(--primary)] text-white'
                              : 'text-gray-700 hover:bg-white/50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ml-1
                      ${currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-white/50'}`}
                  >
                    دواتر
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Join as Writer CTA */}
        <div className="mt-20 bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center shadow-lg border border-white/20 relative overflow-hidden">
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