'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback';
import ArticleCard from '@/components/ArticleCard';
import { useAuth } from '@/contexts/AuthContext';

// Define types
interface WriterProfile {
  _id: string;
  bio: string;
  featured: boolean;
  articlesCount: number;
  followers: number;
  categories: string[];
  socialLinks: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    profileImage: string;
    bannerImage: string;
  };
  articles: Article[];
}

interface Article {
  _id: string;
  title: string;
  description: string;
  slug: string;
  categories: string[];
  createdAt: string;
}

export default function WriterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { username } = params;
  const { currentUser, loading: authLoading } = useAuth();
  
  const [writer, setWriter] = useState<WriterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (username) {
      // Always redirect to user page instead of showing writer page
      router.push(`/users/${username}`);
    }
  }, [username, router]);

  // Keep the fetchWriter function for reference but it won't be called
  const fetchWriter = async () => {
    // This function isn't used anymore since we're redirecting to user page
    if (!username) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = currentUser ? await currentUser.getIdToken(true) : null;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/writers/${username}`,
        token ? {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        } : {}
      );
      
      if (response.status === 404) {
        console.log(`Writer ${username} not found, checking if they are a regular user`);
        
        // Check if they are a regular user with isWriter flag
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/byUsername/${username}`,
          token ? {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          } : {}
        );
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          if (userData.success) {
            console.log(`User ${username} found but is not a writer, redirecting to user page`);
            // Don't redirect to user page if this is due to a disabled writer profile
            // Just throw an error instead and show "Writer not found" message
            throw new Error(`Writer ${username} not found`);
          }
        }
        
        throw new Error(`Writer ${username} not found`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch writer: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWriter(data.writer);
        
        if (currentUser && token) {
          const followStatusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/follow/status/${data.writer.user._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (followStatusResponse.ok) {
            const followData = await followStatusResponse.json();
            setIsFollowing(followData.isFollowing);
          }
        }
      } else {
        throw new Error(data.message || 'Failed to fetch writer profile');
      }
    } catch (error) {
      console.error('Error fetching writer:', error);
      setError('Writer not found or error loading profile');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser || !writer) return;
    
    try {
      setFollowLoading(true);
      
      // Get the user's token for authentication
      const token = await currentUser.getIdToken(true);
      
      const endpoint = isFollowing ? 
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/unfollow/${writer.user._id}` :
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/follow/${writer.user._id}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Toggle follow status
        setIsFollowing(!isFollowing);
        
        // Update follower count
        setWriter(prev => {
          if (!prev) return null;
          return {
            ...prev,
            followers: isFollowing ? prev.followers - 1 : prev.followers + 1
          };
        });
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !writer) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          نووسەر نەدۆزرایەوە
        </h1>
        <p className="text-[var(--grey-dark)] mb-8">
          ببورە، ناتوانین ئەم نووسەرە بدۆزینەوە. تکایە دواتر هەوڵ بدەرەوە یان بگەڕێوە بۆ پەڕەی سەرەکی.
        </p>
        <Link href="/writers" className="btn btn-primary">
          گەڕانەوە بۆ نووسەران
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-[var(--primary-light)]/10 h-48 md:h-64 relative overflow-hidden">
        {writer.user.bannerImage && (
          <div className="absolute inset-0">
            <ImageWithFallback
              src={writer.user.bannerImage}
              alt={`${writer.user.name} banner`}
              fill
              style={{ objectFit: 'cover' }}
              placeholderType="primary"
            />
          </div>
        )}
        
        {/* Actions - removed follow button from here */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {/* Any other actions could go here */}
        </div>
      </div>

      {/* Profile Info */}
      <div className="container mx-auto px-4 relative">
        <div className="bg-white rounded-lg shadow-sm -mt-20 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Image */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md overflow-hidden flex-shrink-0">
              <ImageWithFallback
                src={writer.user.profileImage}
                alt={writer.user.name}
                fill
                style={{ objectFit: 'cover' }}
                placeholderSize="avatar"
                placeholderType="primary"
                initials={writer.user.name.substring(0, 2)}
              />
            </div>

            {/* User Info */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{writer.user.name}</h1>
                  <p className="text-[var(--grey-dark)] mb-3">@{writer.user.username}</p>
                  
                  {/* Follow/Unfollow button - improved placement and styling with fixed hover */}
                  {currentUser && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`px-5 py-2 rounded-full flex items-center gap-2 transition-colors ${
                        isFollowing === true 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                          : 'bg-[var(--primary)] text-white hover:opacity-90'
                      }`}
                    >
                      {followLoading ? (
                        <span className="flex items-center justify-center w-full">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                          <span>{isFollowing === true ? 'لابردن...' : 'شوێنکەوتن...'}</span>
                        </span>
                      ) : (
                        <>
                          {isFollowing === true ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>لابردن</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                              </svg>
                              <span>شوێنکەوتن</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="flex gap-4 mt-2 md:mt-0">
                  <div className="bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    <span className="font-bold">{writer.articlesCount}</span> 
                    <span className="text-[var(--grey-dark)]">وتار</span>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="font-bold">{writer.followers}</span> 
                    <span className="text-[var(--grey-dark)]">شوێنکەوتوو</span>
                  </div>
                </div>
              </div>

              {writer.bio && <p className="text-[var(--grey-dark)] mb-4">{writer.bio}</p>}

              {/* Categories */}
              {writer.categories && writer.categories.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    بابەتەکان:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {writer.categories.map((category, index) => (
                      <span 
                        key={index} 
                        className="bg-[var(--primary-light)]/10 text-[var(--primary)] px-3 py-1 rounded-full text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {writer.socialLinks && Object.values(writer.socialLinks).some(link => link) && (
                <div className="mt-5">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    پەیوەندی:
                  </h3>
                  <div className="flex gap-3">
                  {writer.socialLinks.twitter && (
                      <a 
                        href={writer.socialLinks.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-500 p-3 rounded-lg transition-colors"
                        aria-label="Twitter"
                      >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                      </svg>
                    </a>
                  )}
                  
                  {writer.socialLinks.facebook && (
                      <a 
                        href={writer.socialLinks.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 p-3 rounded-lg transition-colors"
                        aria-label="Facebook"
                      >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                      </svg>
                    </a>
                  )}
                    
                    {writer.socialLinks.instagram && (
                      <a 
                        href={writer.socialLinks.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-gray-50 hover:bg-pink-50 text-gray-500 hover:text-pink-600 p-3 rounded-lg transition-colors"
                        aria-label="Instagram"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                        </svg>
                      </a>
                    )}
                  
                  {writer.socialLinks.linkedin && (
                      <a 
                        href={writer.socialLinks.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-700 p-3 rounded-lg transition-colors"
                        aria-label="LinkedIn"
                      >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                      </svg>
                    </a>
                  )}
                  
                  {writer.socialLinks.website && (
                      <a 
                        href={writer.socialLinks.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 p-3 rounded-lg transition-colors"
                        aria-label="Website"
                      >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                      </svg>
                    </a>
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Writer's Articles */}
      <div className="container mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold mb-6">وتارەکانی {writer.user.name}</h2>
        
        {writer.articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-[var(--grey-dark)]">
              هێشتا هیچ وتارێک بڵاو نەکراوەتەوە.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {writer.articles.map((article) => (
              <ArticleCard
                key={article._id}
                title={article.title}
                description={article.description}
                slug={article.slug}
                author={{
                  name: writer.user.name
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 