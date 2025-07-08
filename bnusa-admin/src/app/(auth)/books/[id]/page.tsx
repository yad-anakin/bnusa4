'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, ArrowUpTrayIcon, XMarkIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Define the book type
interface Book {
  _id?: string;
  title: string;
  writer: string;
  genre: string;
  year: number;
  pages: number;
  description: string;
  publisher: string;
  image: string;
  downloadLink: string;
  format: string;
  size: string;
  rating?: number;
  downloads?: number;
}

export default function BookEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNewBook = params.id === 'new';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [book, setBook] = useState<Book>({
    title: '',
    writer: '',
    genre: 'novel',
    year: new Date().getFullYear(),
    pages: 0,
    description: '',
    publisher: '',
    image: '',
    downloadLink: '',
    format: 'PDF',
    size: '0 MB',
  });

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch book data if editing an existing book
  useEffect(() => {
    const fetchBookData = async () => {
      if (isNewBook) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get auth token from local storage
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`/api/admin/books/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch book: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch book');
        }
        
        console.log('Fetched book:', data);
        setBook(data.book);
      } catch (err: any) {
        console.error('Error fetching book:', err);
        setError(err.message || 'An error occurred while fetching the book');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookData();
  }, [params.id, isNewBook]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBook(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBook(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setError(null);
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should not exceed 5MB');
        return;
      }
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // Upload image
      const response = await fetch('/api/admin/uploads/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }
      
      // Update book state with the new image URL
      setBook(prev => ({ ...prev, image: data.url }));
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'An error occurred while uploading the image');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setError(null);
      
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size should not exceed 100MB');
        return;
      }
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // Upload file
      const response = await fetch('/api/admin/uploads/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload file');
      }
      
      // Format file size
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      // Update book state with the new file URL, format and size
      setBook(prev => ({ 
        ...prev, 
        downloadLink: data.url,
        format: file.name.split('.').pop()?.toUpperCase() || 'PDF',
        size: `${fileSizeInMB} MB`
      }));
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'An error occurred while uploading the file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Validate required fields
      const requiredFields = ['title', 'writer', 'genre', 'year', 'description', 'image', 'downloadLink'];
      for (const field of requiredFields) {
        if (!book[field as keyof Book]) {
          setError(`Please fill in the ${field} field`);
          setIsSaving(false);
          return;
        }
      }

      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // Determine if creating new or updating existing
      const method = isNewBook ? 'POST' : 'PUT';
      const url = isNewBook ? '/api/admin/books' : `/api/admin/books/${params.id}`;
      
      // Submit the book data
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(book)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save book');
      }
      
      console.log('Book saved:', data);
      
      // Show success message
      setSuccessMessage(isNewBook ? 'Book created successfully' : 'Book updated successfully');
      
      // Navigate back to books list after a delay
      setTimeout(() => {
        router.push('/books');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving book:', err);
      setError(err.message || 'An error occurred while saving the book');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isNewBook ? 'Add New Book' : 'Edit Book'}
        </h1>
        <Link 
          href="/books"
          className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 transition"
        >
          Back to Books
        </Link>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 p-4 mb-6 rounded-lg border border-red-200 text-red-700 flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-100 p-4 mb-6 rounded-lg border border-green-200 text-green-700 flex items-start">
          <CheckIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-6 rounded-lg shadow text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Basic info */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium border-b pb-2">Basic Information</h2>
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Book Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={book.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Writer */}
              <div>
                <label htmlFor="writer" className="block text-sm font-medium text-gray-700 mb-1">
                  Writer*
                </label>
                <input
                  type="text"
                  id="writer"
                  name="writer"
                  value={book.writer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Genre (side by side) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
                    Genre*
                  </label>
                  <select
                    id="genre"
                    name="genre"
                    value={book.genre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="novel">Novel</option>
                    <option value="poetry">Poetry</option>
                    <option value="history">History</option>
                    <option value="science">Science</option>
                    <option value="biography">Biography</option>
                    <option value="religion">Religion</option>
                    <option value="children">Children</option>
                  </select>
                </div>
              </div>

              {/* Year and Pages (side by side) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                    Year Published*
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={book.year}
                    onChange={handleNumberChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-1">
                    Pages*
                  </label>
                  <input
                    type="number"
                    id="pages"
                    name="pages"
                    value={book.pages}
                    onChange={handleNumberChange}
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Publisher */}
              <div>
                <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">
                  Publisher
                </label>
                <input
                  type="text"
                  id="publisher"
                  name="publisher"
                  value={book.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={book.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
            </div>

            {/* Right column - Media uploads and preview */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium border-b pb-2">Media & Files</h2>

              {/* Book Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book Cover*
                </label>
                <div className="flex items-start space-x-4">
                  <div className="w-40 h-60 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {book.image ? (
                      <img 
                        src={book.image} 
                        alt="Book cover" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpenIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mb-2 inline-flex items-center"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                      {book.image ? 'Change Cover' : 'Upload Cover'}
                    </button>
                    {book.image && (
                      <button
                        type="button"
                        onClick={() => setBook(prev => ({ ...prev, image: '' }))}
                        className="ml-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 inline-flex items-center"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended size: 600×900 pixels (2:3 ratio)<br />
                      Max file size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Book PDF/File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book File*
                </label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {book.downloadLink ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded mr-3">
                          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {book.format} File 
                            {book.size && ` (${book.size})`}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {book.downloadLink.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBook(prev => ({ 
                          ...prev, 
                          downloadLink: '',
                          format: 'PDF',
                          size: '0 MB'
                        }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <input
                        type="file"
                        accept=".pdf,.epub,.mobi,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="book-file"
                      />
                      <BookOpenIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">
                        Upload the book file (PDF, EPUB, etc.)
                      </p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('book-file')?.click()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                        Upload File
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, EPUB, MOBI, DOC, DOCX, TXT<br />
                  Max file size: 100MB
                </p>
              </div>

              {/* Format and Size (for manual entry if needed) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <input
                    type="text"
                    id="format"
                    name="format"
                    value={book.format}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    id="size"
                    name="size"
                    value={book.size}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Alternative download link input */}
              <div>
                <label htmlFor="downloadLink" className="block text-sm font-medium text-gray-700 mb-1">
                  Alternative Download URL
                </label>
                <input
                  type="url"
                  id="downloadLink"
                  name="downloadLink"
                  value={book.downloadLink}
                  onChange={handleInputChange}
                  placeholder="https://"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If you don't upload a file directly, provide an external download link
                </p>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
            <Link
              href="/books"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 align-middle"></span>
                  <span>{isNewBook ? 'Creating...' : 'Updating...'}</span>
                </>
              ) : (
                <span>{isNewBook ? 'Create Book' : 'Update Book'}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 