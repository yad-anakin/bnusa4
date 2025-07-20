'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ImageWithFallback from '@/components/ImageWithFallback';
import LogoutButton from '@/components/auth/LogoutButton';
import UserListModal from '@/components/users/UserListModal';
import { useToast } from '@/context/ToastContext';
import api from '@/utils/api';

// Define types for user and articles
interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  profileImage: string;
  bannerImage: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  followers: any[];
  following: any[];
  joinDate: string;
  articles: Article[];
  isWriter?: boolean;
  userImage?: {
    userId: string;
    profileImage: string;
    bannerImage: string;
    lastUpdated: string;
  };
}

interface Article {
  _id: string;
  title: string;
  description: string;
  slug: string;
  image?: string;
  coverImage?: string;
  categories: string[];
  readTime?: number;
  likes?: any[];
  comments?: any[];
  createdAt: string;
  status?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { username } = params;
  const { currentUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  // State for user data from API
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isViewingSelf, setIsViewingSelf] = useState(true);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'articles' | 'about'>('articles');

  // New state for modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersData, setFollowersData] = useState<any[]>([]);
  const [followingData, setFollowingData] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const [followersMapRequested, setFollowersMapRequested] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/signin');
    }
  }, [currentUser, authLoading, router]);

  // Fetch user data from API
  useEffect(() => {
    if (!currentUser) return; // Don't fetch if not authenticated
    
    const fetchUserData = async () => {
      if (!currentUser) {
        return;
      }
      
        setLoading(true);
        setError(null);
        
      try {
        // Check if we need to force refresh (from URL param)
        const urlParams = new URLSearchParams(window.location.search);
        const forceRefresh = urlParams.has('refresh');
        
        if (forceRefresh) {
          // console.log('Force refreshing profile data with timestamp:', urlParams.get('refresh'));
          try {
            // Force preload the user's profile image to browser cache
            const freshData = await api.forceRefreshUserData();
            if (freshData.success && freshData.user && freshData.user.userImage?.profileImage) {
              if (typeof window !== 'undefined') {
                const preloadImg = new window.Image();
                preloadImg.src = `${freshData.user.userImage.profileImage}?t=${Date.now()}`;
                // console.log('Preloaded fresh profile image');
              }
            }
          } catch (refreshError) {
            // console.error('Error in force refresh:', refreshError);
          }
        }
        
        // Always use noCache for profile page
        const data = await api.noCache.get('/api/users/profile', {});
        
        if (data.success && data.user) {
          // Check if we have the userImage data
          if (data.user.userImage) {
            // console.log("UserImage data available:", {
            //   profileImage: data.user.userImage.profileImage ? 'available' : 'missing',
            //   bannerImage: data.user.userImage.bannerImage ? 'available' : 'missing',
            //   lastUpdated: data.user.userImage.lastUpdated
            // });
          } else {
            // console.log("UserImage data not found in API response, will use default user.profileImage and user.bannerImage");
          }
          
          setUser(data.user);
          setFollowersData(data.user.followers || []);
          setFollowingData(data.user.following || []);
          } else {
          const errorMessage = data.message || 'Failed to fetch user data';
          console.error(errorMessage);
          setError(errorMessage);
        }
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        setError(apiError.message || 'Error fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Function to handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser || !user) return;
    
    // Check if user is trying to follow themselves
    if (isViewingSelf) {
      showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
      return;
    }
    
    try {
      setFollowLoading(true);
      
      // Immediately update UI for better user experience
      const newFollowingState = !isFollowing;
      setIsFollowing(newFollowingState);
      
      const action = newFollowingState ? 'follow' : 'unfollow';
      // console.log(`Attempting to ${action} user with ID ${user._id}`);
      
      // Use the API utility for the request
      const data = await api.post(`/api/users/${action}/${user._id}`, {});
      
      if (!data.success) {
        // If API call fails, check if it's the "Already following" error or "Cannot follow yourself" error
        // console.error(`${action} request failed:`, data.message);
        
        if (data.message && data.message.includes('Already following this user')) {
          // If we're already following according to the server, make sure UI shows that
          setIsFollowing(true);
          setFollowingMap(prev => ({...prev, [user._id]: true}));
          showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
        } else if (data.message && data.message.includes('Cannot follow yourself')) {
          // Handle attempting to follow yourself
          if (action === 'unfollow') {
            // If we were trying to unfollow and got this error, retry the request
            // console.log('Retrying unfollow action after "Cannot follow yourself" error');
            
            try {
              const retryData = await api.post(`/api/users/unfollow/${user._id}`, {});
              
              if (retryData.success) {
                // Second try succeeded, update UI accordingly
                setIsFollowing(false);
                setFollowingMap(prev => ({...prev, [user._id]: false}));
                showToast('success', 'شوێنکەوتن ڕاگیرا بە سەرکەوتوویی - Unfollowed successfully');
              } else {
                // Retry also failed, revert UI
                setIsFollowing(true);
                setFollowingMap(prev => ({...prev, [user._id]: true}));
                showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
              }
            } catch (retryError) {
              console.error('Error in retry unfollow:', retryError);
              
              // Revert UI
              setIsFollowing(true);
              setFollowingMap(prev => ({...prev, [user._id]: true}));
              showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
            }
            } else {
            // Normal "Cannot follow yourself" error for follow action
            setIsFollowing(false);
            setFollowingMap(prev => ({...prev, [user._id]: false}));
            showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
          }
        } else {
          // For other errors, revert UI and show error
          setIsFollowing(!newFollowingState);
          showToast('error', `Failed to ${action} user: ${data.message}`);
        }
        return;
      }
      
      // API request was successful, update the following map for consistency
      setFollowingMap(prev => ({
        ...prev,
        [user._id]: newFollowingState
      }));
        
        // Find current user's MongoDB _id by querying the profile
        try {
        // Use API utility for profile fetch
        const profileData = await api.get('/api/users/profile');
        
        if (profileData.success) {
            const currentUserId = profileData.user._id;
            
            // Update follower count and list
        if (isFollowing) {
              // When unfollowing, remove the current user from followers
              setUser(prev => {
                if (!prev) return null;
                return {
            ...prev,
                  followers: prev.followers.filter(follower => 
                    typeof follower === 'string' 
                      ? follower !== currentUserId
                      : follower._id !== currentUserId
                  )
                };
              });
        } else {
              // When following, add current user to followers
              setUser(prev => {
                if (!prev) return null;
                return {
            ...prev,
                  followers: [...prev.followers, { 
                    _id: currentUserId,
                    name: currentUser.displayName || 'User',
                    username: profileData.user.username || currentUser.email?.split('@')[0] || 'user',
                    profileImage: currentUser.photoURL || ''
                  }]
                };
              });
            }
          }
        } catch (error) {
          console.error('Error updating followers list:', error);
          // If we can't get the current user's MongoDB ID, just update the follow status
        }
      
      // Show success toast
      showToast('success', newFollowingState 
        ? 'شوێنکەوتن زیاد کرا بە سەرکەوتوویی - Followed successfully'
        : 'شوێنکەوتن ڕاگیرا بە سەرکەوتوویی - Unfollowed successfully'
      );
    } catch (error: any) {
      console.error('Error toggling follow status:', error);
      
      // Revert UI changes on error
      setIsFollowing(!isFollowing);
      
      // Check if it's an "Already following" error message or "Cannot follow yourself" error
      const errorMsg = error.toString();
      if (errorMsg.includes('Already following this user')) {
        setIsFollowing(true);
        setFollowingMap(prev => ({...prev, [user._id]: true}));
        showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
      } else if (errorMsg.includes('Cannot follow yourself')) {
        // Check if this was an unfollow action that errored
        const wasUnfollowAttempt = !isFollowing;
        
        if (wasUnfollowAttempt) {
          // Try to unfollow again
          // console.log('Retrying unfollow action after error');
          
          try {
            const retryData = await api.post(`/api/users/unfollow/${user._id}`, {});
            
            if (retryData.success) {
              // Second try succeeded
              setIsFollowing(false);
              setFollowingMap(prev => ({...prev, [user._id]: false}));
              showToast('success', 'شوێنکەوتن ڕاگیرا بە سەرکەوتوویی - Unfollowed successfully');
            } else {
              // Even retry failed
              setIsFollowing(true);
              setFollowingMap(prev => ({...prev, [user._id]: true}));
              showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
            }
          } catch (retryError) {
            // Retry also failed with exception
            console.error('Error in retry unfollow:', retryError);
            setIsFollowing(true);
            setFollowingMap(prev => ({...prev, [user._id]: true}));
            showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
          }
        } else {
          // Normal follow attempt of yourself
          setIsFollowing(false);
          setFollowingMap(prev => ({...prev, [user._id]: false}));
          showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
        }
      } else {
        showToast('error', 'کردارەکە سەرکەوتوو نەبوو، تکایە دواتر هەوڵ بدەوە - Action failed, please try again later');
      }
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Function to render social media icons
  const renderSocialMedia = () => {
    if (!user?.socialMedia) return null;
    
    const socialIcons = [];
    
    if (user.socialMedia.twitter) {
      socialIcons.push(
        <a
          key="twitter"
          href={`https://twitter.com/${user.socialMedia.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-500 p-3 rounded-lg transition-colors"
          aria-label="Twitter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
          </svg>
        </a>
      );
    }
    
    if (user.socialMedia.facebook) {
      socialIcons.push(
        <a
          key="facebook"
          href={`https://facebook.com/${user.socialMedia.facebook}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 p-3 rounded-lg transition-colors"
          aria-label="Facebook"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
          </svg>
        </a>
      );
    }
    
    if (user.socialMedia.instagram) {
      socialIcons.push(
        <a
          key="instagram"
          href={`https://instagram.com/${user.socialMedia.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-pink-50 text-gray-500 hover:text-pink-600 p-3 rounded-lg transition-colors"
          aria-label="Instagram"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </a>
      );
    }
    
    if (user.socialMedia.linkedin) {
      socialIcons.push(
        <a
          key="linkedin"
          href={`https://linkedin.com/in/${user.socialMedia.linkedin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-700 p-3 rounded-lg transition-colors"
          aria-label="LinkedIn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </a>
      );
    }
    
    if (user.socialMedia.github) {
      socialIcons.push(
        <a
          key="github"
          href={`https://github.com/${user.socialMedia.github}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 p-3 rounded-lg transition-colors"
          aria-label="GitHub"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      );
    }
    
    if (user.socialMedia.website) {
      socialIcons.push(
        <a
          key="website"
          href={user.socialMedia.website}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 p-3 rounded-lg transition-colors"
          aria-label="Website"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </a>
      );
    }
    
    return socialIcons.length > 0 ? (
      <div className="flex gap-3">
        {socialIcons}
      </div>
    ) : null;
  };

  // Fetch followers function
  const fetchFollowers = async () => {
    if (!user || !user._id || !currentUser) {
      // console.log("Cannot fetch followers: missing user or currentUser");
      return;
    }
    
    try {
      setFollowersLoading(true);
      // console.log(`Fetching followers for user ID: ${user._id}`);
      
      // If we have no following data yet but this is the current user's profile,
      // preload the following data to ensure we can show accurate follow status
      if (followingData.length === 0 && isViewingSelf) {
        // console.log("Preloading following data to ensure accurate follow status");
        await fetchFollowing();
      }
      
      // Use the API utility instead of direct fetch
      const data = await api.get(`/api/users/${user._id}/followers`);
      
      // console.log('Fetched followers:', data.followers?.length || 0, 'followers');
      
      // Ensure we preserve the isWriter field from the API response
      // Deduplicate followers by _id
      const uniqueFollowers = removeDuplicates(data.followers || [], '_id');
      // console.log(`After deduplication: ${uniqueFollowers.length} unique followers`);
      
      // Update the followers data in the state - keep all fields including isWriter
      setFollowersData(uniqueFollowers);
      
      // Also update the user's followers count in the main user state
      // Note: When updating the user state, we need to be careful not to lose the isWriter field
      setUser(prev => {
        if (!prev) return null;
        // Only update the followers array if the length has changed
        if (prev.followers.length !== uniqueFollowers.length) {
          return {
            ...prev,
            followers: uniqueFollowers
          };
        }
        return prev;
      });
      
      // Check which users from the followers list the current user is following
      if (uniqueFollowers.length > 0) {
        // console.log("Updating follow status for followers");
        
        // First get accurate follow status from the API
        await updateFollowingMap(uniqueFollowers);
        
        // Then explicitly mark users as followed if they're in our following list
        if (followingData.length > 0) {
          // console.log("Cross-referencing with following data for accuracy");
          const newFollowingMap = {...followingMap};
          const followingIds = followingData.map(u => typeof u === 'string' ? u : u._id);
          
          // For each follower, check if they're in our following list
          uniqueFollowers.forEach((follower: any) => {
            const followerId = typeof follower === 'string' ? follower : follower._id;
            // If this user is in our following list, explicitly mark them as followed
            if (followingIds.includes(followerId)) {
              newFollowingMap[followerId] = true;
            }
          });
          
          // Update the following map with these changes
          setFollowingMap(newFollowingMap);
          // console.log("Final following map after cross-reference:", newFollowingMap);
        }
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setFollowersLoading(false);
    }
  };

  // New function to fetch following data
  const fetchFollowing = async () => {
    if (!user || !user._id || !currentUser) {
      // console.log("Cannot fetch following: missing user or currentUser");
      return;
    }
    
    try {
      setFollowingLoading(true);
      // console.log(`Fetching following for user ID: ${user._id}`);
      
      // Use the API utility instead of direct fetch
      const data = await api.get(`/api/users/${user._id}/following`);
      
      // console.log('Fetched following:', data.following?.length || 0, 'users');
      
      // Ensure we preserve the isWriter field from the API response
      // Deduplicate following list
      const uniqueFollowing = removeDuplicates(data.following || [], '_id');
      // console.log(`After deduplication: ${uniqueFollowing.length} unique following users`);
      
      // Update the following data in state - keep all fields including isWriter
      setFollowingData(uniqueFollowing);
      
      // Also update the user's following count in the main user state
      setUser(prev => {
        if (!prev) return null;
        // Only update the following array if the length has changed
        if (prev.following.length !== uniqueFollowing.length) {
          return {
            ...prev,
            following: uniqueFollowing
          };
        }
        return prev;
      });
      
      // All users in the following list are already being followed by the current user
      // So we set them all to true in the followingMap
      if (uniqueFollowing.length > 0) {
        // Create a new map with all followed users explicitly set to true
        const newFollowingMap: Record<string, boolean> = {...followingMap};
        
        uniqueFollowing.forEach((user: any) => {
          const userId = typeof user === 'string' ? user : user._id;
          // Explicitly set to true to ensure proper UI updates
          newFollowingMap[userId] = true;
        });
        
        // console.log('Updated following map:', newFollowingMap);
        
        // Set the new map using functional update to ensure we don't lose any existing statuses
        setFollowingMap(prev => ({...prev, ...newFollowingMap}));
      }
      
      // Also explicitly update the followingMap for all users in the followers list
      // to ensure the UI is consistent
      if (followersData.length > 0) {
        await updateFollowingMap(followersData);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setFollowingLoading(false);
    }
  };

  // Helper function to remove duplicates from an array of objects based on a key
  const removeDuplicates = (array: any[], key: string) => {
    return array.filter((item, index, self) => 
      index === self.findIndex((t) => (
        (typeof item === 'string' && typeof t === 'string') 
          ? item === t 
          : (item?.[key] && t?.[key] && item[key] === t[key])
      ))
    );
  };

  // Helper function to update followingMap
  const updateFollowingMap = async (users: any[]) => {
    if (!currentUser || !users || users.length === 0) {
      // console.log("Cannot update following map: missing currentUser or empty users array");
      return;
    }
    
    try {
      // Filter out any undefined or null values that might cause issues
      const filteredUsers = users.filter(user => user != null);
      if (filteredUsers.length === 0) {
        // console.log("No valid users to update following map for");
        return;
      }
      
      // Extract IDs correctly, handling both string IDs and objects with _id property
      // Only include valid MongoDB ObjectIds (24 hex characters) and deduplicate
      const userIds = Array.from(new Set(
        filteredUsers.map(user => {
          if (typeof user === 'string') {
            // Valid MongoDB ObjectId check for string IDs
            return /^[0-9a-fA-F]{24}$/.test(user) ? user : null;
          }
          if (user._id && typeof user._id === 'string' && /^[0-9a-fA-F]{24}$/.test(user._id)) {
            return user._id;
          }
          return null;
        }).filter(id => id != null && id !== '')
      ));
      
      if (userIds.length === 0) {
        // Prevent API call if no valid userIds
        return;
      }
      
      // console.log(`Checking follow status for ${userIds.length} users with valid ObjectIds`);
      
      try {
        // Use the API utility with nested try/catch to prevent errors from bubbling up
        const response = await api.post('/api/users/follow/batch-status', { userIds });
        
        if (response.success && response.followStatus) {
          // Convert the response to a map of user ID -> boolean follow status
          const newFollowingMap: Record<string, boolean> = {...followingMap};
          
          // Process the follow status data
          Object.entries(response.followStatus).forEach(([userId, status]) => {
            // Double check userId to make sure it's a valid MongoDB ObjectId
            if (userId && typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
              newFollowingMap[userId] = !!status; // Convert to boolean (though it should already be boolean)
            }
          });
          
          // console.log("Got follow status from API, updating map with valid IDs");
          
          // Update the following map with these results
          setFollowingMap(prev => ({...prev, ...newFollowingMap}));
      } else {
          // console.log("API response successful but no follow status data");
      }
    } catch (error) {
        // Handle API errors gracefully without crashing the UI
        console.error('API error in batch status check:', error);
      }
    } catch (error) {
      console.error('Error in updateFollowingMap:', error);
      // Don't rethrow, just log and continue
    }
  };

  // Function to handle follow/unfollow from the modal
  const handleModalFollowToggle = async (userId: string) => {
    // Don't allow follow/unfollow operations if not logged in
    if (!currentUser) {
      showToast('error', 'Please login to follow users');
      router.push('/login');
      return;
    }
    
    // No need to check if we're trying to follow/unfollow ourself here,
    // because the button shouldn't be visible in this case
    
    // Mark this user as loading
    setFollowLoadingMap(prev => ({...prev, [userId]: true}));
    
    // Determine if user is already being followed
    const isCurrentlyFollowing = followingMap[userId] || false;
    const isFollowersModal = showFollowersModal;
    // console.log(`Current follow status: ${isCurrentlyFollowing ? 'Following' : 'Not following'}`);

    // Optimistically update the UI (we'll revert if the API call fails)
    const newFollowStatus = !isCurrentlyFollowing;
    setFollowingMap(prev => ({...prev, [userId]: newFollowStatus}));
    
    // Determine which action to take
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    
    try {
      // Get user token
      const token = await currentUser.getIdToken();
      
      // Determine which API endpoint to use
      let endpoint;
      
      // If we're in the followers list and trying to "unfollow" someone who follows us,
      // we actually need to remove them as a follower rather than unfollowing them
      if (isFollowersModal && isCurrentlyFollowing) {
        // Use the remove follower endpoint
        endpoint = `/api/users/remove-follower/${userId}`;
        // console.log(`Using remove-follower endpoint for followers list: ${endpoint}`);
      } else {
        // Regular follow/unfollow cases
        endpoint = isCurrentlyFollowing 
          ? `/api/users/unfollow/${userId}`
          : `/api/users/follow/${userId}`;
        // console.log(`Using standard endpoint: ${endpoint}`);
      }
      
      // console.log(`Sending request to ${endpoint}`);
      
      // Use API utility instead of direct fetch
      const data = await api.post(endpoint, {});
      
      if (!data.success) {
        console.error(`API Error: ${data.message}`);
        
        // Check specific error cases
        if (data.message && data.message.includes('Already following this user')) {
          // Already following this user
          setFollowingMap(prev => ({...prev, [userId]: true}));
          showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
          
          // Update UI in followers and following lists
          if (showFollowersModal) {
            setFollowersData(prev => 
              prev.map(user => user._id === userId ? {...user, isFollowing: true} : user)
            );
          }
          
          if (showFollowingModal) {
            setFollowingData(prev => 
              prev.map(user => user._id === userId ? {...user, isFollowing: true} : user)
            );
          }
        } else if (data.message && data.message.includes('Cannot follow yourself')) {
          // Cannot follow yourself error - check if we were trying to unfollow
          if (action === 'unfollow') {
            // If we were trying to unfollow and got this error, retry the request
            // console.log('Retrying unfollow action after "Cannot follow yourself" error');
            
            try {
              const retryData = await api.post(`/api/users/unfollow/${userId}`, {});
              
              if (retryData.success) {
                // Second try succeeded, update UI accordingly
                setFollowingMap(prev => ({...prev, [userId]: false}));
                
                // Update UI in both lists
                if (showFollowersModal) {
                  setFollowersData(prev => 
                    prev.map(user => user._id === userId ? {...user, isFollowing: false} : user)
                  );
                }
                
                if (showFollowingModal) {
                  // For the following modal, remove from list
                  setFollowingData(prev => prev.filter(f => {
                    return typeof f === 'string'
                      ? f !== userId
                      : f._id !== userId;
                  }));
                }
                
                showToast('success', 'دوور کەوتیتەوە لە بەکارهێنەر - Unfollowed user');
              } else {
                // Retry also failed, revert UI
                setFollowingMap(prev => ({...prev, [userId]: isCurrentlyFollowing}));
                
                // Revert UI in lists
                if (showFollowersModal) {
                  setFollowersData(prev => 
                    prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
                  );
                }
                
                if (showFollowingModal) {
                  setFollowingData(prev => 
                    prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
                  );
                }
                
                showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
              }
            } catch (retryError) {
              console.error('Error in retry unfollow:', retryError);
              
              // Revert UI completely
              setFollowingMap(prev => ({...prev, [userId]: isCurrentlyFollowing}));
              
              // Revert UI in lists
              if (showFollowersModal) {
                setFollowersData(prev => 
                  prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
                );
              }
              
              if (showFollowingModal) {
                setFollowingData(prev => 
                  prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
                );
              }
              
              showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
            }
          } else {
            // Normal "Cannot follow yourself" error
            setFollowingMap(prev => ({...prev, [userId]: false}));
            
            // Update UI in lists
            if (showFollowersModal) {
              setFollowersData(prev => 
                prev.map(user => user._id === userId ? {...user, isFollowing: false} : user)
              );
            }
            
            if (showFollowingModal) {
              setFollowingData(prev => 
                prev.map(user => user._id === userId ? {...user, isFollowing: false} : user)
              );
            }
            
            showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
          }
        } else {
          // Other error, revert UI changes
          setFollowingMap(prev => ({...prev, [userId]: isCurrentlyFollowing}));
          showToast('error', data.message || 'هەڵەیەک ڕوویدا، تکایە دووبارە هەوڵ بدەرەوە - An error occurred');
          
          // Revert UI in lists
          if (showFollowersModal) {
            setFollowersData(prev => 
              prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
            );
          }
          
          if (showFollowingModal) {
            setFollowingData(prev => 
              prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
            );
          }
        }
        
        // Clear loading state
        setFollowLoadingMap(prev => ({...prev, [userId]: false}));
        return;
      }
      
      // Success! Update all relevant state
      const newFollowStatus = !isCurrentlyFollowing;
      
      // Lock in the updated followingMap status
      setFollowingMap(prev => ({...prev, [userId]: newFollowStatus}));
      
      // Handle UI updates differently based on which modal we're in
      if (isFollowersModal && isCurrentlyFollowing) {
        // If we're removing a follower, remove them from the followers list
        setFollowersData(prev => prev.filter(follower => {
          return typeof follower === 'string'
            ? follower !== userId
            : follower._id !== userId;
        }));
        
        // Update the main user state
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            followers: prev.followers.filter((f: any) => 
              typeof f === 'string' ? f !== userId : f._id !== userId
            )
          };
        });
      } 
      // If we're unfollowing someone in the following modal, remove them from the following list
      else if (showFollowingModal && isCurrentlyFollowing) {
        // If we're unfollowing in the following modal, remove from the following list
                setFollowingData(prev => prev.filter(following => {
                  return typeof following === 'string'
                    ? following !== userId
                    : following._id !== userId;
                }));
        
        // Update the main user state
                  setUser(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
            following: prev.following.filter((f: any) => 
              typeof f === 'string' ? f !== userId : f._id !== userId
            )
                    };
                  });
      }
      
      // Show success message
      const successMsg = newFollowStatus
        ? 'ئێستا دوای بەکارهێنەر کەوتیت - Now following user'
        : 'دوور کەوتیتەوە لە بەکارهێنەر - Unfollowed user';
      
      showToast('success', successMsg);
    } catch (error: any) {
      console.error('Error in handleModalFollowToggle:', error);
      
      // Check for specific error messages
      const errorMsg = error.toString();
      if (errorMsg.includes('Already following this user')) {
        // Already following
        setFollowingMap(prev => ({...prev, [userId]: true}));
        showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
        
        // Update UI in lists
        if (showFollowersModal) {
          setFollowersData(prev => 
            prev.map(user => user._id === userId ? {...user, isFollowing: true} : user)
          );
        }
        
        if (showFollowingModal) {
          setFollowingData(prev => 
            prev.map(user => user._id === userId ? {...user, isFollowing: true} : user)
          );
        }
      } else if (errorMsg.includes('Cannot follow yourself')) {
        // Cannot follow yourself
        setFollowingMap(prev => ({...prev, [userId]: false}));
        showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
        
        // Update UI in lists
        if (showFollowersModal) {
          setFollowersData(prev => 
            prev.map(user => user._id === userId ? {...user, isFollowing: false} : user)
          );
        }
        
        if (showFollowingModal) {
          setFollowingData(prev => 
            prev.map(user => user._id === userId ? {...user, isFollowing: false} : user)
          );
        }
      } else {
        // Other errors
        setFollowingMap(prev => ({...prev, [userId]: isCurrentlyFollowing}));
        showToast('error', 'هەڵەیەک ڕوویدا، تکایە دووبارە هەوڵ بدەرەوە - An error occurred, please try again');
        
        // Revert UI in lists
      if (showFollowersModal) {
          setFollowersData(prev => 
            prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
          );
      }
      
      if (showFollowingModal) {
          setFollowingData(prev => 
            prev.map(user => user._id === userId ? {...user, isFollowing: isCurrentlyFollowing} : user)
          );
        }
      }
    } finally {
      // Clear loading state
      setFollowLoadingMap(prev => ({...prev, [userId]: false}));
    }
  };

  // Prepare modals when they are about to be shown
  const handleShowFollowersModal = async () => {
    setFollowersMapRequested(false); // Reset flag at the start
    if (user) {
      setFollowersLoading(true);
      try {
        // First, refresh the user data to get the latest follower count
        if (currentUser) {
          const endpoint = isViewingSelf ? 
            '/api/users/profile' : 
            `/api/users/${user.username}`;
          const userData = await api.get(endpoint);
          if (userData.success) {
            setUser(prev => {
              if (!prev) return null;
              return {
                ...prev,
                followers: userData.user.followers || prev.followers
              };
            });
          }
        }
        if (isViewingSelf) {
          await fetchFollowing();
        }
        // Fetch followers and deduplicate
        const data = await api.get(`/api/users/${user._id}/followers`);
        const uniqueFollowers = removeDuplicates(data.followers || [], '_id');
        setFollowersData(uniqueFollowers);
        if (uniqueFollowers.length > 0 && !followersMapRequested) {
          setFollowersMapRequested(true);
          await updateFollowingMap(uniqueFollowers);
        }
        // Cross-reference with followingData for UI
        const followingIds = followingData.map(user => typeof user === 'string' ? user : user._id);
        if (uniqueFollowers.length > 0 && followingIds.length > 0) {
          const newFollowingMap = { ...followingMap };
          uniqueFollowers.forEach(follower => {
            const followerId = typeof follower === 'string' ? follower : follower._id;
            if (followingIds.includes(followerId)) {
              newFollowingMap[followerId] = true;
            }
          });
          setFollowingMap(newFollowingMap);
          followingIds.forEach(id => {
            if (id && !newFollowingMap[id]) {
              setFollowingMap(prev => ({ ...prev, [id]: true }));
            }
          });
        }
      } catch (error) {
        // console.error("Error loading followers:", error);
      } finally {
        setFollowersLoading(false);
      }
    }
    setShowFollowersModal(true);
  };

  const handleShowFollowingModal = async () => {
    if (user && user.following.length > 0) {
      setFollowingLoading(true);
      try {
        // First, refresh the user data to get the latest following count
        if (currentUser) {
          const endpoint = isViewingSelf ? 
            '/api/users/profile' : 
            `/api/users/${user.username}`;
          
          // Use api utility instead of direct fetch
          const userData = await api.get(endpoint);
          
          if (userData.success) {
            // Update the user state with the latest data
            setUser(prev => {
              if (!prev) return null;
              return {
                ...prev,
                following: userData.user.following || prev.following
              };
            });
          }
        }
        
        // Then fetch the following list and update follow statuses
        await fetchFollowing();
        
        // Double check to ensure all users in the following list are properly marked as followed
        if (followingData.length > 0) {
          // Create a new map to ensure UI state is updated
          const newFollowingMap = {...followingMap};
          
          // Set all users in the following list to be followed (true)
          followingData.forEach(user => {
            const userId = typeof user === 'string' ? user : user._id;
            newFollowingMap[userId] = true;
          });
          
          // Update the following map with these changes
          setFollowingMap(prev => ({...prev, ...newFollowingMap}));
        }
      } catch (error) {
        console.error("Error loading following:", error);
      } finally {
        setFollowingLoading(false);
      }
    }
    setShowFollowingModal(true);
  };

  // Check for refresh parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refreshParam = params.get('refresh');
    
    if (refreshParam) {
      // Clear the API cache
      api.clearCache();
      
      // Force a full browser refresh (no cache)
      setTimeout(() => {
        window.location.href = '/profile';
      }, 100);
    }
  }, []);

  // Get the appropriate image URLs from user data
  const getProfileImageUrl = (user: User) => {
    if (user.userImage?.profileImage) {
      return `${user.userImage.profileImage}?v=${new Date().toISOString().split('T')[0]}`;
    }
    if (currentUser?.photoURL && !user.profileImage) {
      return currentUser.photoURL;
    }
    return user.profileImage || '/images/default-avatar.png';
  };

  const getBannerImageUrl = (user: User) => {
    if (user.userImage?.bannerImage) {
      return user.userImage.bannerImage;
    }
    if (user.bannerImage) {
      return user.bannerImage;
    }
    // Fallback to the new Backblaze B2 default
    return 'https://f005.backblazeb2.com/file/bnusa-images/banners/9935e1b6-4094-45b9-aafd-05ea6c6a1816.jpg';
  };

  const profileImageUrl = useMemo(() => user ? getProfileImageUrl(user) : '', [user]);
  const bannerImageUrl = useMemo(() => user ? getBannerImageUrl(user) : '', [user]);

  useEffect(() => {
    // Force a reload of all user images to ensure they're fresh
    const burstImageCache = () => {
      if (user && user.userImage) {
        // Preload the profile and banner images with fresh timestamps
        if (typeof window !== 'undefined') {
          const profileImage = new window.Image();
          profileImage.src = `${user.userImage.profileImage || user.profileImage}?cache=${Date.now()}`;
          
          const bannerImage = new window.Image();
          bannerImage.src = `${user.userImage.bannerImage || user.bannerImage}?cache=${Date.now()}`;
          
          // Removed: console.log('Preloaded fresh images to burst cache');
        }
      }
    };
    
    if (user) {
      burstImageCache();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Return null as useEffect will redirect to /signin
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          هەڵە ڕوویدا
        </h1>
        <p className="text-[var(--grey-dark)] mb-4">
          {error || 'ناتوانین پرۆفایلەکەت بدۆزینەوە. تکایە دواتر هەوڵ بدەرەوە.'}
        </p>
        
        {error && error.includes('Authentication failed') && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 max-w-md mx-auto">
            <h3 className="font-bold text-amber-800 mb-2">Authentication Issue Detected</h3>
            <p className="text-amber-700 mb-2">
              Your login session may have expired or is invalid. Please try signing out and signing in again to refresh your authentication.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/signin" className="btn btn-primary">
                Sign In Again
              </Link>
              <LogoutButton 
                variant="outline" 
                className="px-4 py-2"
                showIcon={true}
                showConfirmation={false}
              />
            </div>
          </div>
        )}
        
        <Link href="/" className="btn btn-primary mt-4">
          گەڕانەوە بۆ پەڕەی سەرەکی
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-64 md:h-80">
        {bannerImageUrl && bannerImageUrl !== '/images/placeholders/profile-banner-primary.jpg' ? (
          <ImageWithFallback
            src={bannerImageUrl}
            alt="Profile banner"
            fill
            style={{ objectFit: 'cover' }}
            className=""
            sizes="100vw"
            priority
            fallbackSrc="/images/deafult-banner.jpg"
            useB2Fallback={true}
            placeholderSize="banner"
            withPattern={true}
          />
        ) : (
          // Default banner when no banner image exists or it's the old default
          <ImageWithFallback
            src="/images/deafult-banner.jpg"
            alt="Default profile banner"
            fill
            style={{ objectFit: 'cover' }}
            className=""
            placeholderSize="banner"
            withPattern={true}
            priority
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="container mx-auto px-4 relative">
        <div className="bg-white rounded-lg -mt-20 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Image */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden flex-shrink-0">
              <ImageWithFallback
                src={profileImageUrl}
                alt={user.name}
                width={160}
                height={160}
                priority={true}
                className="w-full h-full object-cover"
                sizes="128px"
                fallbackSrc="/images/default-avatar.png"
                useB2Fallback={true}
                placeholderSize="avatar"
              />
            </div>

            {/* User Info */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{user.name}</h1>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-[var(--grey-dark)]">@{user.username}</p>
                    {user.isWriter && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        نووسەر
                      </span>
                    )}
                  </div>
                  
                  {/* Settings link - only visible on own profile */}
                  {isViewingSelf && (
                    <Link 
                      href="/settings"
                      className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors mb-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ڕێکخستنەکان
                    </Link>
                  )}
                  
                  {/* Follow/Unfollow button - moved here and improved styling */}
                  {!isViewingSelf && (
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
                  
                  {/* Link to writer profile page */}
                  {!isViewingSelf && (
                    <Link 
                      href={`/writers/${user.username}`}
                      className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors mt-3 inline-block"
                    >
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        وتارەکانی ببینە
                      </span>
                    </Link>
                  )}
                  
                  <div className="flex flex-wrap gap-4 mt-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      <span className="font-semibold">{user.articles?.length || 0}</span>
                      <span className="text-[var(--grey-dark)]">وتار</span>
                </div>
                    <button
                      onClick={handleShowFollowersModal}
                      className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      <span className="font-semibold">{user.followers?.length || 0}</span>
                      <span className="text-[var(--grey-dark)]">شوێنکەوتوو</span>
                    </button>
                    <button
                      onClick={handleShowFollowingModal}
                      className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="font-semibold">{user.following?.length || 0}</span>
                      <span className="text-[var(--grey-dark)]">شوێنکەوتن</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    دەربارە:
                  </h3>
                  <p className="text-[var(--grey-dark)]">{user.bio}</p>
                </div>
              )}

              {/* Social Media */}
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
                  </svg>
                  پەیوەندی:
                </h3>
                {renderSocialMedia()}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b">
          <div className="flex gap-8">
            <button
              className={`pb-4 font-medium ${
                activeTab === 'articles'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--grey-dark)]'
              }`}
              onClick={() => setActiveTab('articles')}
            >
              وتارەکان
            </button>
            <button
              className={`pb-4 font-medium ${
                activeTab === 'about'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--grey-dark)]'
              }`}
              onClick={() => setActiveTab('about')}
            >
              دەربارە
            </button>
          </div>
        </div>

        {/* Articles Grid */}
        {activeTab === 'articles' && (
          <div className="py-8">
            {/* Article Status Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    هەموو وتارە نوێیەکان پێویستیان بە پێداچوونەوە هەیە پێش بڵاوکردنەوە. هەندێک وتاری خۆت لەوانەیە لە دۆخی "چاوەڕوانی پێداچوونەوە" بن.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.articles.length === 0 ? (
                <div className="col-span-3 text-center py-12 bg-white rounded-lg">
                  <p className="text-[var(--grey-dark)]">
                    هیچ وتارێک بڵاو نەکراوەتەوە.
                  </p>
                </div>
              ) : (
                user.articles.map((article) => (
                  <article
                    key={article._id}
                    className="bg-white rounded-lg overflow-hidden hover:transition-shadow"
                  >
                    <Link href={`/articles/${article.slug}`} className="block">
                      <div className="relative h-48">
                        {/* Status Badge */}
                        {article.status && article.status !== 'published' && (
                          <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-semibold
                            ${article.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              article.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}
                          >
                            {article.status === 'pending' ? 'چاوەڕوانی پێداچوونەوە' : 
                             article.status === 'rejected' ? 'ڕەتکراوەتەوە' : 
                             article.status === 'draft' ? 'ڕەشنووس' : ''}
                          </div>
                        )}
                        <ImageWithFallback
                          src={article.image || article.coverImage || '/images/placeholders/article-primary.png'}
                          alt={article.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          placeholderSize="article"
                          placeholderType="primary"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-6">
                        {/* Rest of the article card remains the same */}
                        <h2 className="text-xl font-bold mb-2 line-clamp-2">
                          {article.title}
                        </h2>
                        <p className="text-[var(--grey-dark)] mb-4 line-clamp-2">
                          {article.description}
                        </p>
                        
                        {/* Categories */}
                        {article.categories && article.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {article.categories.map((category, index) => (
                              <span key={index} className="inline-block bg-gray-100 text-xs rounded-full px-2 py-1 text-[var(--grey-dark)]">
                                {category}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Rest of the card content remains the same */}
                      </div>
                    </Link>
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {/* About Section */}
        {activeTab === 'about' && (
          <div className="py-8">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">دەربارەی من</h2>
              <p className="text-[var(--grey-dark)] mb-6">
                {user.bio}
              </p>
              
              <h3 className="font-bold mb-2">پەیوەندی</h3>
              <div className="flex gap-4">
                {renderSocialMedia()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserListModal
        isOpen={showFollowersModal}
        onClose={() => { setShowFollowersModal(false); setFollowersMapRequested(false); }}
        title={`شوێنکەوتوانی ${user?.name}`}
        users={followersData}
        emptyMessage="هیچ شوێنکەوتوویەک نییە"
        currentUserId={currentUser?.uid}
        onFollowToggle={handleModalFollowToggle}
        followingMap={followingMap}
        followLoading={followLoadingMap}
        isFollowersList={true}
      />

      <UserListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title={`ئەوانەی ${user?.name} شوێنیان کەوتووە`}
        users={followingData}
        emptyMessage="هیچ شوێنکەوتنێک نییە"
        currentUserId={currentUser?.uid}
        onFollowToggle={handleModalFollowToggle}
        followingMap={followingMap}
        followLoading={followLoadingMap}
        isFollowersList={false}
      />
    </div>
  );
} 