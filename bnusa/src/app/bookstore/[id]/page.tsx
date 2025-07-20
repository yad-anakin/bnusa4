'use client';
import { useState, useEffect, use as usePromise } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import NotFound from '@/components/NotFound';

// Book interface
interface Book {
  _id: string;
  id?: string;
  slug: string; // Add slug to the interface
  title: string;
  writer: string;
  language: string;
  genre: string;
  year: number;
  image: string;
  publisher: string;
  downloadLink: string;
  description: string;
  rating: number;
  downloads: number;
  pages: number;
  format: string;
  size: string;
}

interface RelatedBook {
  _id: string;
  id?: string;
  slug?: string; // Add slug to the interface
  title: string;
  image: string;
  writer: string;
  year?: number;
  genre?: string;
  downloads?: number;
}

export default function BookPage({ params }: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Unwrap params using React.use() for Next.js App Router compliance
  let bookId = '';
  if (typeof (params as any)?.then === 'function') {
    const unwrappedParams = usePromise(params as Promise<{ id: string }>);
    bookId = (unwrappedParams as { id: string }).id;
  } else {
    bookId = (params as { id: string }).id;
  }
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch the main book
        const data = await api.get(`/api/books/${bookId}`);
        if (data.success) {
          setBook(data.book);
          // Fetch related books by genre, excluding the current book
          if (data.book && data.book.genre) {
            const related = await api.get(`/api/books?genre=${encodeURIComponent(data.book.genre)}&excludeId=${data.book.id || ''}&limit=6`);
            if (related.success && Array.isArray(related.books)) {
              // Filter out the current book if present
              setRelatedBooks(related.books.filter((b: any) => b.id !== data.book.id).slice(0, 6));
            } else {
              setRelatedBooks([]);
            }
          } else {
            setRelatedBooks([]);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch book');
        }
      } catch (err: any) {
        console.error('Error fetching book:', err);
        setError(err.message || 'An error occurred while fetching the book');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookData();
  }, [bookId]);

  const handleDownload = async () => {
    if (!book) return;
    
    try {
      setDownloading(true);
      
      // Call API to increment download count using the secure API utility
      await api.get(`/api/books/${bookId}?download=true`, {});
      
      // Open the download link in a new tab
      window.open(book.downloadLink, '_blank');
    } catch (err) {
      console.error('Error triggering download:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error || !book) {
    return <NotFound message="ببورە، کتێبەکە نەدۆزرایەوە." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/5 via-white to-[var(--primary)]/5">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 right-6 z-50 bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/20 hover:bg-white/30 transition-colors duration-300"
      >
        <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Content */}
      <div className="px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Book Image and Quick Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--primary)]/10 bg-white/40 backdrop-blur-sm">
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 80vw, 400px"
                />
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-1 text-[var(--primary)] bg-[var(--primary)]/10 px-4 py-2 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="font-semibold">{book.downloads || 0} داگرتن</span>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`block w-full py-4 text-center rounded-xl border transition-colors duration-300 font-semibold text-lg ${
                    downloading 
                      ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' 
                      : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20'
                  }`}
                >
                  {downloading ? 'دەگوازرێتەوە...' : 'داگرتنی کتێب'}
                </button>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-[var(--primary)] mb-4">{book.title}</h1>
                <p className="text-[var(--grey-dark)] text-lg mb-6">{book.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-white/40 rounded-xl p-4 border border-[var(--primary)]/10">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">نووسەر</h3>
                  <p className="text-lg font-semibold">{book.writer}</p>
                </div>
                <div className="bg-white/40 rounded-xl p-4 border border-[var(--primary)]/10">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">جۆر</h3>
                  <p className="text-lg font-semibold">{book.genre}</p>
                </div>
                <div className="bg-white/40 rounded-xl p-4 border border-[var(--primary)]/10">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">ساڵ</h3>
                  <p className="text-lg font-semibold">{book.year}</p>
                </div>
                <div className="bg-white/40 rounded-xl p-4 border border-[var(--primary)]/10">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">لاپەڕە</h3>
                  <p className="text-lg font-semibold">{book.pages}</p>
                </div>
                <div className="bg-white/40 rounded-xl p-4 border border-[var(--primary)]/10">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">قەبارە</h3>
                  <p className="text-lg font-semibold">{book.size}</p>
                </div>
              </div>

              {/* Related Books */}
              {relatedBooks.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">کتێبە پەیوەندیدارەکان</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {relatedBooks.map((relatedBook) => (
                      <Link href={`/bookstore/${relatedBook.id}`} key={relatedBook.id}>
                        <div className="bg-white/40 rounded-xl p-4 border border-[var(--primary)]/10 hover:border-[var(--primary)]/30 transition-colors duration-300">
                          <div className="flex items-center space-x-4">
                            <div className="relative w-16 h-24 rounded-lg overflow-hidden">
                              <Image
                                src={relatedBook.image || '/images/book-placeholder.jpg'}
                                alt={relatedBook.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold mb-1">{relatedBook.title}</h3>
                              <p className="text-sm text-[var(--grey)]">{relatedBook.writer}</p>
                              {(relatedBook.year || relatedBook.genre) && (
                                <div className="flex items-center space-x-2 mt-1">
                                  {relatedBook.year && (
                                    <span className="text-xs text-[var(--primary)]">{relatedBook.year}</span>
                                  )}
                                  {relatedBook.year && relatedBook.genre && (
                                    <span className="text-xs text-[var(--grey)]">•</span>
                                  )}
                                  {relatedBook.genre && (
                                    <span className="text-xs text-[var(--grey)]">{relatedBook.genre}</span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center mt-1">
                                <svg className="w-3 h-3 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-xs text-gray-700 ml-1">{relatedBook.downloads || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 