'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { DocumentTextIcon, CheckCircleIcon, XCircleIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';

// Define the article type
interface Article {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  categories: string[];
  createdAt: string;
  author: {
    name: string;
    username: string;
  };
  status: 'pending';
  likes: number;
  comments: number;
  youtubeLinks?: string[];
  resourceLinks?: Array<{url: string, title: string, type: string}>;
  images?: string[];
}

// Define pagination data type
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function PendingArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  const fetchPendingArticles = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: 'pending' // Always filter by pending status
      });
      
      if (search) {
        queryParams.append('search', search);
      }

      console.log(`Fetching pending articles: /api/admin/articles?${queryParams.toString()}`);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // Use the local API route with auth token
      const response = await fetch(`/api/admin/articles?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending articles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch pending articles');
      }
      
      console.log('Fetched pending articles:', data);
      setArticles(data.articles || []);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching pending articles:', err);
      setError(err.message || 'An error occurred while fetching pending articles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingArticles(pagination.page, searchQuery);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPendingArticles(1, searchQuery);
  };

  const handleApprove = async (articleId: string) => {
    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // First, fetch the article to get all its data including youtubeLinks and resourceLinks
      const fetchResponse = await fetch(`/api/admin/articles/${articleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch article details before approving');
      }
      
      const articleData = await fetchResponse.json();
      const article = articleData.article;
      
      // Now update the article with its existing data plus the new status
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'published',
          youtubeLinks: article.youtubeLinks || [],
          resourceLinks: article.resourceLinks || []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve article');
      }

      // Remove the article from the list (it's no longer pending)
      setArticles(articles.filter(article => article._id !== articleId));
      // Update pagination
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err: any) {
      console.error('Error approving article:', err);
      setError(err.message || 'An error occurred while approving the article');
    }
  };

  const handleReject = async (articleId: string) => {
    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // First, fetch the article to get all its data including youtubeLinks and resourceLinks
      const fetchResponse = await fetch(`/api/admin/articles/${articleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch article details before rejecting');
      }
      
      const articleData = await fetchResponse.json();
      const article = articleData.article;
      
      // Now update the article with its existing data plus the new status
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'rejected',
          youtubeLinks: article.youtubeLinks || [],
          resourceLinks: article.resourceLinks || []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject article');
      }

      // Remove the article from the list (it's no longer pending)
      setArticles(articles.filter(article => article._id !== articleId));
      // Update pagination
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err: any) {
      console.error('Error rejecting article:', err);
      setError(err.message || 'An error occurred while rejecting the article');
    }
  };

  const handlePreview = (articleId: string) => {
    // Open preview in a new tab
    window.open(`/articles/preview/${articleId}`, '_blank');
  };

  const handleEdit = (articleId: string) => {
    // Navigate to the article edit page
    window.location.href = `/articles/${articleId}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Pending Articles</h1>
        <div className="flex items-center">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending articles..."
              className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 px-4 py-2 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending articles found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {articles.map((article) => (
                  <li key={article._id} className="hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <DocumentTextIcon className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-indigo-600">
                              <Link href={`/articles/${article._id}`} className="hover:underline">
                                {article.title}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {article.description ? (
                                article.description.length > 100 ? 
                                  article.description.substring(0, 100) + '...' : 
                                  article.description
                              ) : ''}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span className="mr-4">By {article.author.name}</span>
                              <span className="mr-4">
                                {new Date(article.createdAt).toLocaleDateString()}
                              </span>
                              <span className="mr-4">
                                <span className="font-medium">{article.likes}</span> likes
                              </span>
                              <span className="mr-4">
                                <span className="font-medium">{article.comments}</span> comments
                              </span>
                              {/* Resource indicators */}
                              {article.youtubeLinks && article.youtubeLinks.length > 0 && (
                                <span className="flex items-center mr-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-medium">{article.youtubeLinks.length}</span> videos
                                </span>
                              )}
                              {article.resourceLinks && article.resourceLinks.length > 0 && (
                                <span className="flex items-center mr-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-medium">{article.resourceLinks.length}</span> resources
                                </span>
                              )}
                              {article.images && article.images.length > 0 && (
                                <span className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-medium">{article.images.length}</span> images
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handlePreview(article._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Preview
                          </button>
                          <button
                            onClick={() => handleEdit(article._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleApprove(article._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(article._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </div>
                      {article.categories.length > 0 && (
                        <div className="mt-2">
                          {article.categories.map((category) => (
                            <span
                              key={category}
                              className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Show YouTube links and resource links more visibly */}
                      {(article.youtubeLinks && article.youtubeLinks.length > 0) || 
                       (article.resourceLinks && article.resourceLinks.length > 0) ? (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          {article.youtubeLinks && article.youtubeLinks.length > 0 && (
                            <div className="mb-2">
                              <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                YouTube Videos ({article.youtubeLinks.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {article.youtubeLinks.map((link, idx) => {
                                  // Extract YouTube video ID for thumbnail
                                  const videoId = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                                  
                                  return videoId ? (
                                    <div key={`yt-${idx}`} className="flex items-center bg-gray-50 rounded px-2 py-1 text-xs border border-gray-200">
                                      <img 
                                        src={`https://img.youtube.com/vi/${videoId[1]}/default.jpg`}
                                        alt="YouTube thumbnail"
                                        className="w-8 h-6 mr-2 object-cover rounded"
                                      />
                                      <span className="truncate max-w-[150px]">Video {idx + 1}</span>
                                    </div>
                                  ) : (
                                    <div key={`yt-invalid-${idx}`} className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs">
                                      Invalid URL
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {article.resourceLinks && article.resourceLinks.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                Resources ({article.resourceLinks.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {article.resourceLinks.map((resource, idx) => (
                                  <div key={`res-${idx}`} className="flex items-center bg-gray-50 rounded px-2 py-1 text-xs border border-gray-200">
                                    {resource.type === 'pdf' ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    ) : resource.type === 'doc' ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    <span className="truncate max-w-[150px]" title={resource.title}>{resource.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination controls */}
          {pagination.pages > 1 && (
            <div className="py-3 flex items-center justify-between border-t border-gray-200 mt-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> pending articles
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => fetchPendingArticles(1, searchQuery)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">First</span>
                      <span>First</span>
                    </button>
                    <button
                      onClick={() => fetchPendingArticles(Math.max(1, pagination.page - 1), searchQuery)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() => fetchPendingArticles(Math.min(pagination.pages, pagination.page + 1), searchQuery)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <span>Next</span>
                    </button>
                    <button
                      onClick={() => fetchPendingArticles(pagination.pages, searchQuery)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Last</span>
                      <span>Last</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 