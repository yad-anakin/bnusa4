'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { DocumentTextIcon, FunnelIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  status: 'published' | 'pending' | 'rejected' | 'draft';
  likes: number;
  comments: number;
}

// Define pagination data type
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function ArticlesPage() {
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
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  const fetchArticles = async (page = 1, search = '', status = '') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      if (status) {
        queryParams.append('status', status);
      }

      console.log(`Fetching articles: /api/admin/articles?${queryParams.toString()}`);
      
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
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch articles');
      }
      
      console.log('Fetched articles:', data);
      setArticles(data.articles || []);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError(err.message || 'An error occurred while fetching articles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(pagination.page, searchQuery, statusFilter);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(1, searchQuery, statusFilter);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    setStatusFilter(status);
    fetchArticles(1, searchQuery, status);
  };

  const handleUpdateStatus = async (articleId: string, newStatus: string) => {
    try {
      // First, fetch the article to get all its data including youtubeLinks and resourceLinks
      const fetchResponse = await fetch(`/api/admin/articles/${articleId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch article details before updating status');
      }
      
      const articleData = await fetchResponse.json();
      const article = articleData.article;
      
      // Now update the article with its existing data plus the new status
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          youtubeLinks: article.youtubeLinks || [],
          resourceLinks: article.resourceLinks || []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update article status');
      }

      // Update article in the state (optimistic update)
      setArticles(articles.map(article => 
        article._id === articleId 
          ? { ...article, status: newStatus as any } 
          : article
      ));
    } catch (err: any) {
      console.error('Error updating article status:', err);
      setError(err.message || 'An error occurred while updating article status');
    }
  };

  // Function to get badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Add these new methods
  const handlePreview = (articleId: string) => {
    // Open preview in a new tab
    window.open(`/articles/preview/${articleId}`, '_blank');
  };

  const handleEdit = (articleId: string) => {
    // Navigate to the article edit page
    window.location.href = `/articles/${articleId}`;
  };

  const handleDelete = async (articleId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete article');
      }

      // Remove the article from the state
      setArticles(articles.filter(article => article._id !== articleId));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
      
      setShowDeleteConfirm(false);
      setArticleToDelete(null);
    } catch (err: any) {
      console.error('Error deleting article:', err);
      setError(err.message || 'An error occurred while deleting the article');
    }
  };

  const confirmDelete = (articleId: string) => {
    setArticleToDelete(articleId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setArticleToDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Articles</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
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
                <p className="text-gray-500">No articles found</p>
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
                              <span>
                                <span className="font-medium">{article.comments}</span> comments
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="mr-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(article.status)}`}>
                              {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                            </span>
                          </div>
                          <div className="mr-2">
                            <select
                              value={article.status}
                              onChange={(e) => handleUpdateStatus(article._id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-md p-1"
                            >
                              <option value="published">Publish</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Reject</option>
                              <option value="draft">Draft</option>
                            </select>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePreview(article._id)}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Preview
                            </button>
                            <button
                              onClick={() => handleEdit(article._id)}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              <PencilIcon className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(article._id)}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-red-600 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              <TrashIcon className="h-3 w-3 mr-1" />
                              Delete
                            </button>
                          </div>
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
                    of <span className="font-medium">{pagination.total}</span> articles
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => fetchArticles(1, searchQuery, statusFilter)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">First</span>
                      <span>First</span>
                    </button>
                    <button
                      onClick={() => fetchArticles(Math.max(1, pagination.page - 1), searchQuery, statusFilter)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() => fetchArticles(Math.min(pagination.pages, pagination.page + 1), searchQuery, statusFilter)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <span>Next</span>
                    </button>
                    <button
                      onClick={() => fetchArticles(pagination.pages, searchQuery, statusFilter)}
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this article? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => articleToDelete && handleDelete(articleToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 