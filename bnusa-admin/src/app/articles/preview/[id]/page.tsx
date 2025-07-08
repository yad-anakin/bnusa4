'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { ArrowUturnLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import React from 'react';
import parse from 'html-react-parser';

// Define the article type
interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description?: string;
  featuredImage?: string;
  images?: string[];
  categories: string[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  author: {
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  status: 'published' | 'pending' | 'rejected' | 'draft';
  likes: number;
  comments: number;
  youtubeLinks?: string[];
  resourceLinks?: Array<{url: string, title: string, type: string}>;
}

export default function ArticlePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const articleId = params.id;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);
  
  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch article');
        }
        
        console.log('Article data received:', data.article); // Debug log
        console.log('Content contains images:', data.article.content.includes('<img')); // Check if content has images
        
        // Enhanced debugging for YouTube and resource links
        console.log('YouTube links:', {
          exists: !!data.article.youtubeLinks,
          isArray: Array.isArray(data.article.youtubeLinks),
          length: Array.isArray(data.article.youtubeLinks) ? data.article.youtubeLinks.length : 'not an array',
          value: data.article.youtubeLinks,
        });
        
        console.log('Resource links:', {
          exists: !!data.article.resourceLinks,
          isArray: Array.isArray(data.article.resourceLinks),
          length: Array.isArray(data.article.resourceLinks) ? data.article.resourceLinks.length : 'not an array',
          value: data.article.resourceLinks,
        });
        
        // Check for images array
        if (data.article.images && Array.isArray(data.article.images) && data.article.images.length > 0) {
          console.log('Article has additional images array:', data.article.images);
        }
        
        // Process image tags if present
        if (data.article.content.includes('<img')) {
          console.log('Found img tags in content');
        }
        
        setArticle(data.article);
      } catch (error: any) {
        console.error('Error fetching article:', error);
        setError(error.message || 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticle();
  }, [articleId]);
  
  const handleEditArticle = () => {
    router.push(`/articles/${articleId}`);
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error || 'Article not found. It may have been deleted or you do not have permission to view it.'}
            </p>
            <div className="mt-4">
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Admin toolbar */}
      <div className="bg-white shadow-sm py-2 px-4 fixed w-full z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4">
              Admin Preview Mode
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              article.status === 'published' ? 'bg-green-100 text-green-800' :
              article.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              article.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
            </span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowUturnLeftIcon className="mr-1 h-4 w-4" />
              Back
            </button>
            
            <button
              onClick={handleEditArticle}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilSquareIcon className="mr-1 h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>
      
      {/* Article content with spacing for the admin toolbar */}
      <div className="pt-16 pb-12 flex-grow">
        <article className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          {/* Featured Image */}
          {article.featuredImage && (
            <div className="w-full h-96 bg-gray-200 relative">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('Featured image failed to load:', article.featuredImage);
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800?text=Image+Not+Found';
                }}
              />
            </div>
          )}
          
          <div className="p-6 md:p-8 lg:p-10">
            {/* Title and meta */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
            
            <div className="flex flex-wrap items-center text-sm text-gray-600 mb-6">
              {/* Author information */}
              <div className="flex items-center mr-6 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-2">
                  {article.author?.profileImage ? (
                    <img
                      src={article.author.profileImage}
                      alt={article.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                      {article.author?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <span>{article.author?.name || 'Unknown Author'}</span>
              </div>
              
              {/* Publication date */}
              <div className="mr-6 mb-2">
                <span className="text-gray-500">
                  {new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {/* Read time (estimated) */}
              <div className="mb-2">
                <span className="text-gray-500">
                  {Math.max(1, Math.ceil(article.content.split(' ').length / 200))} min read
                </span>
              </div>
            </div>
            
            {/* Categories and tags */}
            {(article.categories?.length > 0 || article.tags?.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.categories?.map(category => (
                  <span 
                    key={category} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {category}
                  </span>
                ))}
                
                {article.tags?.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Description */}
            {article.description && (
              <div className="text-lg text-gray-700 mb-8 italic border-l-4 border-gray-200 pl-4">
                {article.description}
              </div>
            )}
            
            {/* Additional Images from images array */}
            {article.images && article.images.length > 0 && (
              <div className="my-8">
                <h3 className="text-lg font-semibold mb-4">Publisher Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {article.images.map((imgUrl, index) => (
                    <div key={`additional-img-${index}`} className="overflow-hidden rounded-lg border border-gray-200">
                      <img 
                        src={imgUrl} 
                        alt={`Article image ${index + 1}`}
                        className="w-full h-64 object-cover"
                        onLoad={() => console.log('Publisher image loaded successfully:', imgUrl)}
                        onError={(e) => {
                          console.error('Publisher image failed to load:', imgUrl);
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* YouTube Videos Section */}
            {article.youtubeLinks && article.youtubeLinks.length > 0 && (
              <div className="my-8">
                <h3 className="text-lg font-semibold mb-4">YouTube Videos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {article.youtubeLinks.map((link, index) => {
                    // Extract YouTube video ID
                    const videoId = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    
                    return videoId ? (
                      <div key={`youtube-${index}`} className="overflow-hidden rounded-lg border border-gray-200">
                        <div className="aspect-w-16 aspect-h-9">
                          <iframe 
                            src={`https://www.youtube.com/embed/${videoId[1]}`}
                            title={`YouTube video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          ></iframe>
                        </div>
                        <div className="p-2 bg-gray-50 text-xs text-gray-500 truncate">
                          {link}
                        </div>
                      </div>
                    ) : (
                      <div key={`youtube-invalid-${index}`} className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-600">
                        Invalid YouTube URL: {link}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Resource Links Section */}
            {article.resourceLinks && article.resourceLinks.length > 0 && (
              <div className="my-8">
                <h3 className="text-lg font-semibold mb-4">Resources and Documents</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {article.resourceLinks.map((resource, index) => (
                      <li key={`resource-${index}`} className="py-3 flex items-start">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          {resource.type === 'pdf' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                          ) : resource.type === 'doc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'presentation' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'spreadsheet' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'googledoc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h6v1H5V6zm0 3h6v1H5V9zm0 3h6v1H5v-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                          <a 
                            href={resource.url} 
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-xs text-indigo-600 hover:text-indigo-900 hover:underline truncate block"
                          >
                            {resource.url}
                          </a>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Open
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {article.content.includes('<img') || (article.content.includes('<') && article.content.includes('>'))
                ? parse(article.content, {
                    replace: (domNode) => {
                      // Log all nodes for debugging
                      console.log('Parsing node:', domNode);
                      
                      if (domNode.type === 'tag' && domNode.name === 'img') {
                        const element = domNode as any;
                        
                        // Debug log for image element
                        console.log('Found image in content:', element.attribs);
                        
                        // Create a unique key for this image
                        const imageKey = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        // Add necessary attributes and error handling
                        return (
                          <div key={imageKey} className="my-6 text-center">
                            <img 
                              src={element.attribs.src} 
                              alt={element.attribs.alt || article.title}
                              width="100%"
                              height="auto"
                              className="max-w-full rounded-lg mx-auto"
                              style={{
                                display: 'block',
                                maxWidth: '100%',
                                margin: '0 auto',
                                border: '1px solid #eaeaea'
                              }}
                              onLoad={() => console.log('Content image loaded successfully:', element.attribs.src)}
                              onError={(e) => {
                                console.error('Content image failed to load:', element.attribs.src);
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                                (e.target as HTMLImageElement).style.border = '1px solid #ff0000';
                              }}
                            />
                          </div>
                        );
                      }
                      
                      // For other HTML elements, return undefined to use default parser behavior
                      return undefined;
                    }
                  })
                : article.content.split('\n').map((paragraph, idx) => (
                    paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
                  ))
              }
            </div>
            
            {/* Debugging info - can be removed in production */}
            <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs text-gray-600">
              <details>
                <summary>Debug Info</summary>
                <p className="mt-2"><strong>Content starts with:</strong> {article.content.substring(0, 100)}...</p>
                <p className="mt-2"><strong>Contains img tags:</strong> {article.content.includes('<img') ? 'Yes' : 'No'}</p>
                <p className="mt-2"><strong>Contains HTML:</strong> {article.content.includes('<') && article.content.includes('>') ? 'Yes' : 'No'}</p>
                <p className="mt-2"><strong>Has additional images array:</strong> {article.images && article.images.length > 0 ? `Yes (${article.images.length} images)` : 'No'}</p>
                <p className="mt-2"><strong>Has YouTube links:</strong> {article.youtubeLinks && article.youtubeLinks.length > 0 ? `Yes (${article.youtubeLinks.length} videos)` : 'No'}</p>
                <p className="mt-2"><strong>Has resource links:</strong> {article.resourceLinks && article.resourceLinks.length > 0 ? `Yes (${article.resourceLinks.length} resources)` : 'No'}</p>
              </details>
            </div>
            
            {/* Engagement stats */}
            <div className="mt-10 pt-6 border-t border-gray-200 flex items-center text-gray-500">
              <div className="mr-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{article.likes || 0} likes</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{article.comments || 0} comments</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
} 