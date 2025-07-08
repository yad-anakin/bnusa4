'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { BookOpenIcon, FunnelIcon, EyeIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Define the book type
interface Book {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

// Define pagination data type
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);

  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  const fetchBooks = async (page = 1, search = '', genre = '', language = '') => {
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
      
      if (genre) {
        queryParams.append('genre', genre);
      }

      if (language) {
        queryParams.append('language', language);
      }

      console.log(`Fetching books: /api/admin/books?${queryParams.toString()}`);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // Use the local API route with auth token
      const response = await fetch(`/api/admin/books?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch books');
      }
      
      console.log('Fetched books:', data);
      setBooks(data.books || []);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching books:', err);
      setError(err.message || 'An error occurred while fetching books');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(pagination.page, searchQuery, genreFilter, languageFilter);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(1, searchQuery, genreFilter, languageFilter);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genre = e.target.value;
    setGenreFilter(genre);
    fetchBooks(1, searchQuery, genre, languageFilter);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    setLanguageFilter(language);
    fetchBooks(1, searchQuery, genreFilter, language);
  };

  const handlePageChange = (newPage: number) => {
    fetchBooks(newPage, searchQuery, genreFilter, languageFilter);
  };

  const handlePreview = (bookId: string) => {
    // Open preview in a new tab
    window.open(`/bookstore/${bookId}`, '_blank');
  };

  const handleEdit = (bookId: string) => {
    // Navigate to the book edit page
    router.push(`/books/${bookId}`);
  };

  const confirmDelete = (bookId: string) => {
    setBookToDelete(bookId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setBookToDelete(null);
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/books/${bookToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete book');
      }

      // Remove the deleted book from the state
      setBooks(books.filter(book => book._id !== bookToDelete));
      
      // Reset delete confirmation
      setShowDeleteConfirm(false);
      setBookToDelete(null);
    } catch (err: any) {
      console.error('Error deleting book:', err);
      setError(err.message || 'An error occurred while deleting the book');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    router.push('/books/new');
  };

  // Pagination control components
  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4">
      <div>
        <span className="text-sm text-gray-700">
          Showing <span className="font-medium">{books.length}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> books
        </span>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className={`px-3 py-1 rounded ${
            pagination.page <= 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>
        
        {/* Page number buttons */}
        {[...Array(pagination.pages)].map((_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-1 rounded ${
                pagination.page === pageNum
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
          className={`px-3 py-1 rounded ${
            pagination.page >= pagination.pages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Book Management</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Book
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-grow md:max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
              <select 
                value={genreFilter} 
                onChange={handleGenreChange}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genres</option>
                <option value="novel">Novel</option>
                <option value="poetry">Poetry</option>
                <option value="history">History</option>
                <option value="science">Science</option>
                <option value="biography">Biography</option>
                <option value="religion">Religion</option>
                <option value="children">Children</option>
              </select>
            </div>

            <div className="flex items-center">
              <select 
                value={languageFilter} 
                onChange={handleLanguageChange}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Languages</option>
                <option value="kurdish">Kurdish</option>
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
                <option value="persian">Persian</option>
                <option value="turkish">Turkish</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 p-4 mb-6 rounded-lg border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Books table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Downloads</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading books...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No books found
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-8 relative mr-3 flex-shrink-0">
                          {book.image ? (
                            <img 
                              src={book.image} 
                              alt={book.title} 
                              className="h-full w-full object-cover rounded"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 rounded flex items-center justify-center">
                              <BookOpenIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">{book.writer}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{book.genre}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{book.language}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{book.year}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{book.downloads}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(book._id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Preview"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(book._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(book._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && pagination.pages > 0 && (
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <PaginationControls />
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this book? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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