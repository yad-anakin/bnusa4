'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ImageWithFallback';
import ArticleImageGallery from '@/components/ArticleImageGallery';
import CommentSection from '@/components/CommentSection';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/context/ToastContext';
import NotFound from '@/components/NotFound';

type Article = {
  _id: string;
  id?: string | number;
  title: string;
  description: string;
  content: string;
  coverImage: string;
  categories: string[];
  views: number;
  readTime: number;
  createdAt: string;
  images: string[];
  author: {
    _id: string;
    name: string;
    username: string;
    profileImage: string;
    isWriter?: boolean;
  };
  likes: string[];
  slug: string;
  status?: string;
  youtubeLinks?: string[];
  resourceLinks?: Array<{url: string, title: string, type: string}>;
};

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const lastFetchedSlug = useRef<string | null>(null);
  const [relatedLikeCounts, setRelatedLikeCounts] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shareMenuRef]);

  useEffect(() => {
    const fetchArticle = async () => {
      const slug = params.id as string;
      setDebugInfo(prev => ({ ...prev, slug }));
      
      if (lastFetchedSlug.current === slug) return;
      lastFetchedSlug.current = slug;
      
      try {
        const data = await api.get(`/api/articles/${slug}`);
        
        if (data.success && data.article) {
          setDebugInfo(prev => ({ 
            ...prev, 
            articleData: data.success ? 'received' : 'error',
            hasYoutubeLinks: Array.isArray(data.article.youtubeLinks) && data.article.youtubeLinks.length > 0,
            youtubeLinksCount: Array.isArray(data.article.youtubeLinks) ? data.article.youtubeLinks.length : 0,
            hasResourceLinks: Array.isArray(data.article.resourceLinks) && data.article.resourceLinks.length > 0,
            resourceLinksCount: Array.isArray(data.article.resourceLinks) ? data.article.resourceLinks.length : 0
          }));
        }
        
        if (data.success) {
          setArticle(data.article);
          fetchRelatedArticles(data.article);
          // Fetch like data after article is loaded
          fetchLikeData(data.article._id);
        } else {
          throw new Error(data.error || 'Failed to fetch article');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setDebugInfo(prev => ({ ...prev, error: err instanceof Error ? err.message : 'An error occurred' }));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  const fetchRelatedArticles = async (currentArticle: Article) => {
    if (!currentArticle || !currentArticle.categories || currentArticle.categories.length === 0) return;
    
    try {
      setLoadingRelated(true);
      
      const categories = currentArticle.categories;
      
      const allRelatedArticles: Article[] = [];
      
      const addedArticleIds = new Set<string>();
      addedArticleIds.add(currentArticle.id?.toString() || currentArticle._id);
      
      for (const category of categories) {
        if (allRelatedArticles.length >= 8) break;
        
        const categoryParam = `&category=${encodeURIComponent(category)}`;
        const apiUrl = `/api/articles?limit=5${categoryParam}`;
        
        try {
          const data = await api.get(apiUrl);
          
          if (data.success && data.articles) {
            for (const article of data.articles) {
              const articleId = article.id?.toString() || article._id;
              if (!addedArticleIds.has(articleId) && allRelatedArticles.length < 8) {
                allRelatedArticles.push(article);
                addedArticleIds.add(articleId);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching articles for category ${category}:`, error);
        }
      }
      
      const sortedRelatedArticles = allRelatedArticles
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);
      
      setRelatedArticles(sortedRelatedArticles);
    } catch (err) {
      console.error('Error fetching related articles:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ku-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    if (!article) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };
  
  const shareToSocial = (platform: string) => {
    if (!article) return;
    
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article.title);
    const text = encodeURIComponent(article.description);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${title} ${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            alert('لینک کۆپی کرا بۆ کلیپبۆرد');
          })
          .catch(err => {
            console.error('Failed to copy: ', err);
          });
        setShowShareMenu(false);
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setShowShareMenu(false);
  };

  const isBackblazeUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('https://') && !url.includes('/images/');
  };

  // Like functionality
  const fetchLikeData = async (articleId: string) => {
    try {
      // Get like count
      const countResponse = await api.get(`/api/likes/${articleId}/count`);
      if (countResponse.success) {
        setLikeCount(countResponse.count);
      }

      // Check if user has liked (only if user is authenticated)
      if (currentUser) {
        const likeStatusResponse = await api.get(`/api/likes/${articleId}/check`);
        if (likeStatusResponse.success) {
          setHasLiked(likeStatusResponse.hasLiked);
        }
      }
    } catch (error) {
      console.error('Error fetching like data:', error);
      // Fallback to old likes array if new API fails
      if (article && article.likes) {
        setLikeCount(article.likes.length);
        if (currentUser) {
          setHasLiked(article.likes.includes(currentUser._id));
        }
      }
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUser) {
      // Redirect to signin or show login modal
      showToast('info', 'پێویستە چوونە ژوورەوە بکەیت بۆ پسندکردنی وتارەکان');
      router.push('/signin');
      return;
    }

    if (!article || isLiking) return;

    setIsLiking(true);
    try {
      const action = hasLiked ? 'unlike' : 'like';
      const response = await api.post(`/api/likes/${article._id}/toggle`, { action });
      
      if (response.success) {
        setLikeCount(response.likes);
        setHasLiked(response.hasLiked);
        
        // Show success toast
        const message = hasLiked ? 'وتارەکە لە پسندکردنەکانت لابردرا' : 'وتارەکە بە سەرکەوتوویی پسندکرا';
        showToast('success', message);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('error', 'کێشەیەک هەبوو لە پسندکردنی وتارەکە. تکایە دووبارە هەوڵ بدەرەوە.');
    } finally {
      setIsLiking(false);
    }
  };

  // Fetch like counts for related articles
  useEffect(() => {
    if (!relatedArticles || relatedArticles.length === 0) return;
    let isMounted = true;
    const fetchCounts = async () => {
      const counts: { [id: string]: number } = {};
      await Promise.all(
        relatedArticles.map(async (related) => {
          const articleId = related._id; // Always use _id for LikeCounter
          try {
            const res = await api.get(`/api/likes/${articleId}/count`);
            counts[articleId] = res && res.success ? res.count : 0;
          } catch {
            counts[articleId] = 0;
          }
        })
      );
      if (isMounted) setRelatedLikeCounts(counts);
    };
    fetchCounts();
    return () => { isMounted = false; };
  }, [relatedArticles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
              <p className="mt-4 text-[var(--grey-dark)]">چاوەڕوانی بارکردنی وتارەکە بکە...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <NotFound message="ببورە، وتارەکە نەدۆزرایەوە." />;
  }

  if (!article) {
    return <NotFound message="ببورە، وتارەکە نەدۆزرایەوە." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {article.status && article.status !== 'published' && (
          <div className={`rounded-lg p-4 mb-6 ${
            article.status === 'pending' 
              ? 'bg-yellow-50 border border-yellow-200' 
              : article.status === 'rejected' 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {article.status === 'pending' ? (
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  article.status === 'pending' 
                    ? 'text-yellow-800' 
                    : article.status === 'rejected' 
                      ? 'text-red-800' 
                      : 'text-gray-800'
                }`}>
                  {article.status === 'pending' 
                    ? 'ئەم وتارە چاوەڕوانی پێداچوونەوەیە' 
                    : article.status === 'rejected' 
                      ? 'ئەم وتارە ڕەتکراوەتەوە' 
                      : 'ئەم وتارە چاپ نەکراوە'
                  }
                </h3>
                <div className={`mt-2 text-sm ${
                  article.status === 'pending' 
                    ? 'text-yellow-700' 
                    : article.status === 'rejected' 
                      ? 'text-red-700' 
                      : 'text-gray-700'
                }`}>
                  <p>
                    {article.status === 'pending' 
                      ? 'وتارەکەت لەلایەن تیمی پێداچوونەوەی بونساوە هەڵدەسەنگێندرێت و بەم زووانە بڕیاری لەسەر دەدرێت. ئێمە بە ئیمەیل ئاگادارت دەکەینەوە کاتێک پێداچوونەوەکە تەواو دەبێت.' 
                      : article.status === 'rejected' 
                        ? 'بەداخەوە، ئەم وتارە ناگونجێت لەگەڵ ڕێنماییەکانی ناوەڕۆکی بونسا. تکایە پەیوەندی بکە بە پشتگیری بەکارهێنەران بۆ زانیاری زیاتر.' 
                        : 'ئەم وتارە لە ئێستادا بڵاو نەکراوەتەوە.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-[var(--grey-dark)] hover:text-[var(--primary)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            گەڕانەوە
          </button>
        </div>

        {/* Standalone cover image with border radius */}
        <div className="w-full flex justify-center items-center rounded-2xl overflow-hidden mb-6">
          <div className="relative w-full max-w-3xl aspect-[16/9]">
            <ImageWithFallback
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="w-full h-auto rounded-2xl"
              priority
            />
          </div>
        </div>

        {/* Title and description below image */}
        <div className="mb-4 px-2 md:px-0">
          <h1 className="text-2xl md:text-4xl font-bold text-[var(--foreground)] mb-4">{article.title}</h1>
          <p className="text-[var(--grey-dark)] text-sm md:text-base mb-6">{article.description}</p>
          {/* Categories under description, with extra space */}
          <div className="flex flex-wrap gap-2 mb-6">
            {article.categories.map((category, index) => (
              <span
                key={index}
                className="inline-block text-[var(--primary)] text-xs px-3 py-1 rounded-lg font-medium border border-[color:rgba(0,80,200,0.10)]"
              >
                {category}
              </span>
            ))}
          </div>
          <div className="border-b border-gray-200 mb-2"></div>
        </div>

        {/* Author and info row, same improved layout as before */}
        <div className="w-full flex flex-col gap-y-2 gap-x-6 px-2 md:px-0 py-4 text-sm text-[var(--grey-dark)] md:flex-row md:items-center md:justify-between">
          {/* Author */}
          <div className="flex items-center flex-wrap gap-3 min-w-0 mb-4 pb-4 border-b border-gray-200 md:mb-0 md:pb-0 md:border-b-0 w-full">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 relative">
              {isBackblazeUrl(article.author.profileImage) ? (
                <ImageWithFallback
                  src={article.author.profileImage}
                  alt={article.author.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="40px"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <Link href={`/users/${article.author.username}`} className="font-medium hover:text-[var(--primary)] transition-colors truncate block text-base md:text-lg">
                {article.author.name}
              </Link>
              <div className="flex items-center flex-wrap gap-2">
                <p className="text-xs text-[var(--grey)] truncate">@{article.author.username}</p>
                {article.author.isWriter && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
                    <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    نووسەر
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Info Elements: Grouped 2 by 2 on small screens, evenly spaced on large screens */}
          <div className="flex flex-col gap-y-2 w-full md:flex-row md:gap-y-0 md:gap-x-0 md:flex-1 md:justify-end">
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 w-full md:flex md:flex-row md:gap-y-0 md:gap-x-10 md:justify-evenly md:w-auto">
              <span className="flex items-center whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="mr-1">{formatDate(article.createdAt)}</span>
              </span>
              <span className="flex items-center whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="mr-1">{article.readTime} خولەک خوێندنەوە</span>
              </span>
              <span className="flex items-center whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="mr-1">{likeCount} پسندکردن</span>
              </span>
              <span className="flex items-center whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span className="mr-1">{article.views} بینین</span>
              </span>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 mb-2"></div>

        <div className="container mx-auto px-6 py-8 p-4 md:p-6">
            <style jsx global>{`
              .article-content {
                font-family: var(--font-rabar), system-ui, sans-serif !important;
                line-height: 1.8;
                color: #333;
                max-width: none;
              }
              
              .article-content h1 {
                font-size: 2rem;
                font-weight: 700;
                margin-top: 2rem;
                margin-bottom: 1rem;
                color: #111;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content h2 {
                font-size: 1.75rem;
                font-weight: 600;
                margin-top: 1.75rem;
                margin-bottom: 0.75rem;
                color: #222;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content h3 {
                font-size: 1.5rem;
                font-weight: 600;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                color: #333;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content h4 {
                font-size: 1.25rem;
                font-weight: 600;
                margin-top: 1.25rem;
                margin-bottom: 0.5rem;
                color: #444;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content p {
                margin-bottom: 1.25rem;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content ul,
              .article-content ol {
                margin-top: 1rem;
                margin-bottom: 1.5rem;
                padding-right: 2rem;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content ul {
                list-style-type: disc;
              }
              
              .article-content ol {
                list-style-type: decimal;
              }
              
              .article-content li {
                margin-bottom: 0.5rem;
                padding-right: 0.5rem;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content strong {
                font-weight: 700;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content em {
                font-style: italic;
                font-family: var(--font-rabar), system-ui, sans-serif !important;
              }
              
              .article-content blockquote {
                margin: 1.5rem 0;
                padding: 0.5rem 1.5rem;
                border-right: 4px solid #ddd;
                background: #f9f9f9;
                font-style: italic;
                color: #555;
              }
              
              .article-content a {
                color: #3b82f6;
                text-decoration: underline;
                transition: color 0.2s;
              }
              
              .article-content a:hover {
                color: #2563eb;
              }
              
              .article-content pre {
                background: #f1f5f9;
                border-radius: 0.375rem;
                padding: 1rem;
                overflow-x: auto;
                margin: 1.5rem 0;
              }
              
              .article-content code {
                font-family: monospace;
                background: #f1f5f9;
                padding: 0.125rem 0.25rem;
                border-radius: 0.25rem;
              }
              
              .article-content table {
                width: 100%;
                border-collapse: collapse;
                margin: 1.5rem 0;
              }
              
              .article-content th,
              .article-content td {
                border: 1px solid #ddd;
                padding: 0.5rem;
                text-align: right;
              }
              
              .article-content th {
                background-color: #f1f5f9;
                font-weight: 600;
              }
              
              .article-content img {
                max-width: 100%;
                height: auto;
                border-radius: 0.375rem;
                margin: 1.5rem 0;
              }
              
              .article-content hr {
                border: 0;
                border-top: 1px solid #ddd;
                margin: 2rem 0;
              }
            `}</style>
            <div 
              className="prose prose-lg max-w-none article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            
            {article.youtubeLinks && article.youtubeLinks.length > 0 && (
              <div className="mt-12 pt-10 relative">
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-4 text-gray-800 bg-white py-2 px-4 rounded-full">
                      <span className="bg-gradient-to-r from-red-600 to-red-500 text-white p-2 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98A.998.998 0 008 6.82z"/>
                        </svg>
                      </span>
                      <span>ڤیدیۆکانی یوتیوب</span>
                    </h3>
                    
                    <a 
                      href="https://www.youtube.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-xs sm:text-sm font-medium text-gray-600 hover:text-red-600 transition-colors bg-white py-2 px-4 rounded-full"
                    >
                      <span>سەردانی یوتیوب بکە</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-3 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {article.youtubeLinks.map((link, index) => {
                    const videoId = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    
                    return videoId ? (
                        <div key={index} className="bg-white rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 transform hover:-translate-y-1 group">
                          <div className="relative pb-[56.25%] h-0 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/30 transition-all duration-300">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600/90 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8 text-white mr-[-2px]">
                                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98A.998.998 0 008 6.82z"/>
                                  </svg>
                                </div>
                              </div>
                              
                          <iframe 
                            src={`https://www.youtube.com/embed/${videoId[1]}`}
                            title={`YouTube video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                                loading="lazy"
                          ></iframe>
                        </div>
                          </div>
                          
                          <div className="p-4 sm:p-5 border-t border-gray-50">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                                    <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/>
                                  </svg>
                                </div>
                              </div>
                              
                              <div className="flex-1 mr-0">
                                <a 
                                  href={link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="block text-sm sm:text-base font-semibold text-gray-800 hover:text-red-600 transition-colors group-hover:underline line-clamp-2"
                                  title={link}
                                >
                                  ڤیدیۆی یوتیوب #{index + 1}
                                </a>
                                <div className="flex flex-wrap items-center mt-2">
                                  <span className="inline-flex items-center gap-2 text-xs text-red-600 font-medium mr-3">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                      <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/>
                                    </svg>
                                    <span>YouTube</span>
                                  </span>
                                  <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-gray-300 mx-2"></span>
                                  <span className="text-xs text-gray-500 mr-3 sm:mr-3 sm:ml-3">کردنەوە لە یوتیوب</span>
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <a 
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group-action relative inline-flex items-center justify-center p-2 sm:p-3 text-red-600 hover:text-white transition-all duration-300 rounded-full overflow-hidden"
                                  title="کردنەوە لە یوتیوب"
                                >
                                  <span className="absolute inset-0 bg-red-100 opacity-0 group-action-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
                                  
                                  <span className="absolute inset-0 bg-red-600 opacity-0 group-action-hover:opacity-90 scale-0 group-action-hover:scale-100 transition-all duration-300 rounded-full"></span>
                                  
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                        </div>
                      </div>
                    ) : (
                        <div key={index} className="bg-white rounded-2xl overflow-hidden border border-red-100 p-4 sm:p-5 flex items-center gap-4 group transform hover:-translate-y-1 transition-all duration-300">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 mr-0 overflow-hidden">
                            <p className="text-red-600 font-bold text-sm sm:text-base">ڤیدیۆی نادروست</p>
                            <p className="text-red-500 text-xs sm:text-sm mt-2 truncate group-hover:text-clip group-hover:overflow-ellipsis">{link}</p>
                          </div>
                      </div>
                    );
                  })}
                </div>
                </div>
                
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-100 rounded-full opacity-70 transform translate-x-1/2 translate-y-1/2"></div>
              </div>
            )}
            
            {article.resourceLinks && article.resourceLinks.length > 0 && (
              <div className="mt-12 pt-10 relative">
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-4 text-gray-800 bg-white py-2 px-4 rounded-full">
                      <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-2 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span>سەرچاوەکان و بەڵگەنامەکان</span>
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {article.resourceLinks.map((resource, index) => (
                      <div key={index} className="bg-white rounded-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 group">
                        <div className="p-5 flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 ${
                              resource.type === 'pdf' 
                                ? 'bg-red-100' 
                                : resource.type === 'doc' || resource.type === 'googledoc'
                                  ? 'bg-blue-100' 
                                  : resource.type === 'presentation'
                                    ? 'bg-orange-100'
                                    : resource.type === 'spreadsheet'
                                      ? 'bg-green-100'
                                      : 'bg-gray-100'
                            } rounded-full flex items-center justify-center`}>
                              {resource.type === 'pdf' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              ) : resource.type === 'doc' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              ) : resource.type === 'presentation' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                                </svg>
                              ) : resource.type === 'spreadsheet' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                                </svg>
                              ) : resource.type === 'googledoc' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                                  <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h8a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                  <path d="M4 9a1 1 0 011-1h1a1 1 0 010 2H5a1 1 0 01-1-1zM4 12a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM5 6a1 1 0 100 2h1a1 1 0 100-2H5z" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-medium text-lg text-gray-800">{resource.title}</h4>
                            <p className="text-gray-500 text-sm mt-1 mb-3 truncate max-w-full">{resource.url}</p>
                            <a 
                              href={resource.url} 
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                              <span>داگرتن یان کردنەوە</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-100 rounded-full opacity-70 transform translate-x-1/2 translate-y-1/2"></div>
              </div>
            )}
            
            {(article.images && article.images.length > 0 ? article.images : []).length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">وێنەکانی وتارەکە</h3>
                <ArticleImageGallery 
                  images={article.images && article.images.length > 0 ? article.images : []} 
                />
              </div>
            )}
          </div>

          <div className="container mx-auto px-6 py-6 border-t border-gray-100">
          <div className="flex justify-between items-center">
            {/* Like Button */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLikeToggle}
                disabled={isLiking}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  hasLiked 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLiking ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 ${hasLiked ? 'fill-current' : 'stroke-current fill-none'}`} 
                    viewBox="0 0 24 24" 
                    strokeWidth={hasLiked ? 0 : 2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                <span className="font-medium">{likeCount}</span>
                <span className="text-sm">{hasLiked ? 'پسندکراوە' : 'پسندکردن'}</span>
              </button>
            </div>

            {/* Share Button */}
              <div className="flex space-x-2 relative" ref={shareMenuRef}>
                <button 
                  onClick={handleShare}
                  className="flex items-center text-[var(--grey-dark)] hover:text-[var(--primary)] transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  بڵاوکردنەوە
                </button>
                
                {showShareMenu && (
                  <div className="absolute left-0 bottom-12 bg-white shadow-lg rounded-lg p-2 z-50 w-48">
                    <div className="py-1">
                      <button
                        onClick={() => shareToSocial('facebook')}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                      >
                        <svg className="h-5 w-5 text-blue-600 ml-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        فەیسبووک
                      </button>
                      <button
                        onClick={() => shareToSocial('twitter')}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                      >
                        <svg className="h-5 w-5 text-blue-400 ml-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        تویتەر
                      </button>
                      <button
                        onClick={() => shareToSocial('telegram')}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                      >
                        <svg className="h-5 w-5 text-blue-500 ml-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-3.578 15.744c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        تێلێگرام
                      </button>
                      <button
                        onClick={() => shareToSocial('whatsapp')}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                      >
                        <svg className="h-5 w-5 text-green-500 ml-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        واتساپ
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => shareToSocial('copy')}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                      >
                        <svg className="h-5 w-5 text-gray-500 ml-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                        </svg>
                        لینک کۆپی بکە
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Comment Section - restored at the end of the article */}
        <div className="mt-10">
        <CommentSection articleId={article._id} articleOwnerId={article.author._id} />
        </div>

        {/* Related Articles Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">وتاری پەیوەندیدار</h2>
          
          {loadingRelated ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
              <p className="mt-4 text-[var(--grey-dark)]">چاوەڕوانی بارکردنی وتارەکان بکە...</p>
            </div>
          ) : relatedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedArticles.map((related) => (
                <Link href={`/publishes/${related.id || related._id}`} key={related.id || related._id}>
                  <div 
                    className="bg-white rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative h-48">
                      {related.coverImage ? (
                        <ImageWithFallback
                          src={related.coverImage}
                          alt={related.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-12 w-12 mx-auto text-gray-400" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                              />
                            </svg>
                            <p className="text-gray-500 text-xs mt-2 px-2">وێنە بەردەست نییە</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {related.categories?.slice(0, 2).map((category, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{related.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{related.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {related.readTime || 5} خولەک
                        </span>
                        <span className="mx-2">•</span>
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {related.views || 0}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {relatedLikeCounts[related._id] ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-[var(--grey-dark)]">هیچ وتارێکی پەیوەندیدار نەدۆزرایەوە.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 