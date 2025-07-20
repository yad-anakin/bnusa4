'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ImageWithFallback from '@/components/ImageWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import ArticleCard from '@/components/ArticleCard';
import { useToast } from '@/context/ToastContext';
import api from '@/utils/api';
import UserListModal from '@/components/users/UserListModal';

// Define types
interface Article {
  _id: string;
  title: string;
  description: string;
  slug: string;
  categories?: string[];
  createdAt: string;
  coverImage?: string;
  status?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  profileImage: string;
  bannerImage: string;
  followers: any[];
  following: any[];
  joinDate: string;
  firebaseUid?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  isWriter?: boolean;
  isSupervisor?: boolean;
  isDesigner?: boolean;
  supervisorText?: string;
  designsCount?: number;
  articles?: Article[];
  userImage?: {
    userId: string;
    profileImage: string;
    bannerImage: string;
    lastUpdated: string;
  };
}

// Add type for following/followers user
interface FollowUser {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
  isWriter?: boolean;
  isFollowing?: boolean;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { username } = params;
  const usernameStr = Array.isArray(username) ? username[0] : username;
  const { currentUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  // State variables for pathname check (fixes "window is not defined" error)
  const [pathname, setPathname] = useState('');
  const [isProfilePage, setIsProfilePage] = useState(false);
  
  // Initialize pathname on client-side only
  useEffect(() => {
    // This runs only in the browser, avoiding the "window is not defined" error
    setPathname(window.location.pathname || '');
    setIsProfilePage(window.location.pathname.includes('/users/'));
  }, []);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  
  // Add state variables for followers/following modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingFollowToggle, setLoadingFollowToggle] = useState<Record<string, boolean>>({});
  const lastFetchedUsername = useRef<string | null>(null);
  const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
  const [publishedArticlesCount, setPublishedArticlesCount] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/signin');
      return;
    }
    
    if (usernameStr) {
      // Prevent double fetch for the same username
      if (lastFetchedUsername.current === usernameStr) return;
      lastFetchedUsername.current = usernameStr;
      fetchUser(usernameStr);
    }
  }, [usernameStr, currentUser, authLoading]);

  useEffect(() => {
    if (user && user._id) {
      // Fetch published articles for this user
      api.get(`/api/users/${user._id}/published-articles`).then(res => {
        if (res.success && Array.isArray(res.articles)) {
          setPublishedArticles(res.articles);
        } else {
          setPublishedArticles([]);
        }
      }).catch(() => setPublishedArticles([]));
      // Fetch published articles count for this user
      api.get(`/api/users/${user._id}/published-articles-count`).then(res => {
        if (res.success && typeof res.count === 'number') {
          setPublishedArticlesCount(res.count);
        } else {
          setPublishedArticlesCount(0);
        }
      }).catch(() => setPublishedArticlesCount(0));
    }
  }, [user]);

  // Check if the profile being viewed is the current user's own profile
  const isOwnProfile = React.useMemo(() => {
    if (!currentUser || !user) return false;
    
    // Extract username from email as a fallback
    const currentUsername = currentUser.email?.split('@')[0];
    const isUsernameMatch = currentUsername && user.username === currentUsername;
    
    return (
      user._id === currentUser.uid ||
      user.firebaseUid === currentUser.uid ||
      user.email === currentUser.email ||
      isUsernameMatch
    );
  }, [currentUser, user]);

  const fetchUser = async (usernameParam: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we need to force refresh (from URL param)
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const forceRefresh = urlParams ? urlParams.has('refresh') : false;
      
      if (forceRefresh && urlParams) {
        // Removed: console.log('Force refreshing user data with timestamp:', urlParams.get('refresh'));
      }
      
      // Always use noCache to get fresh data
      const response = await api.noCache.get(`/api/users/byUsername/${usernameParam}`, {});
      
      if (response.success && response.user) {
        // Set user data directly from the response
        // The user object should already contain articles array
        setUser(response.user);
        
        // Removed: console.log("User profile loaded with", response.user.articles ? response.user.articles.length : 0, "articles", {timestamp: Date.now()});
        
        // Check if the current user is following this user
        if (currentUser && response.user._id) {
          try {
            // Removed: console.log(`Checking follow status for user ID: ${response.user._id}`);
            
            // Call the follow status API
            const followStatusResponse = await api.get(`/api/users/follow/status/${response.user._id}`);
            
            if (followStatusResponse.success) {
              // Removed: console.log(`Follow status response:`, followStatusResponse);
              setIsFollowing(followStatusResponse.isFollowing);
              
              // Also update the followingMap for consistency
              setFollowingMap(prev => ({
                ...prev,
                [response.user._id]: followStatusResponse.isFollowing
              }));
            } else {
              console.error('Failed to get follow status:', followStatusResponse);
              setIsFollowing(false);
            }
          } catch (followError) {
            console.error('Error checking follow status:', followError);
            setIsFollowing(false);
          }
        }
      } else {
        setError(response.message || 'هەڵە ڕوویدا لە کاتی هێنانی پڕۆفایلەکە');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('هەڵە ڕوویدا لە کاتی هێنانی پڕۆفایلەکە');
      
      // If error, create a fallback user for display
      if (usernameParam) {
        const fallbackName = usernameParam.toString().substring(0, 1).toUpperCase() + 
                             usernameParam.toString().substring(1);
        const fallbackUser: UserProfile = {
          _id: '0',
          name: fallbackName,
          username: usernameParam.toString(),
          email: '',
          bio: 'Profile information temporarily unavailable',
          profileImage: '',
          bannerImage: '',
          followers: [],
          following: [],
          joinDate: new Date().toISOString(),
          articles: [] // Empty articles array for fallback
        };
        setUser(fallbackUser);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle follow/unfollow
  const handleFollowToggle = async () => {
    if (isOwnProfile) {
      // Remove console log
      showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت'); // Kurdish message only
      return;
    }
    
    if (!user || !currentUser) {
      console.error("User data or current user is missing");
      showToast('error', 'پێویستە خۆت تۆمار بکەیت بۆ شوێنکەوتن - You need to be logged in to follow users');
      return;
    }
    
    // Set loading state
    setFollowLoading(true);
    
    // Immediately update UI for better user experience
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    
    try {
      const action = newFollowingState ? 'follow' : 'unfollow';
      // Removed: console.log(`Attempting to ${action} user with ID ${user._id}`);
      
      // Use the API utility for the request
      const data = await api.post(`/api/users/${action}/${user._id}`, {});
      
      if (!data.success) {
        // If API call fails, check if it's the "Already following" error or "Cannot follow yourself" error
        if (data.message && data.message.includes('Already following this user')) {
          setIsFollowing(true);
          setFollowingMap(prev => ({...prev, [user._id]: true}));
          showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
        } else if (data.message && data.message.includes('Cannot follow yourself')) {
          setIsFollowing(false);
          setFollowingMap(prev => ({...prev, [user._id]: false}));
          showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
          // Do not log this error to the console
        } else {
          // For other errors, revert UI and show error
          setIsFollowing(!newFollowingState);
          showToast('error', `Failed to ${action} user: ${data.message}`);
          console.error(`${action} request failed:`, data.message);
        }
        return;
      }
      
      // Update follower count
      const newFollowerCount = newFollowingState 
        ? (user.followers.length + 1) 
        : (user.followers.length - 1);
      setFollowerCount(Math.max(0, newFollowerCount));
      
      // Also update the followers array in the user object to keep the UI in sync
      setUser(prev => {
        if (!prev) return null;
        
        let updatedFollowers = [...prev.followers];
        
        if (!newFollowingState) {
          // Remove current user from followers if unfollowing
          updatedFollowers = updatedFollowers.filter(f => 
            typeof f === 'string' 
              ? f !== currentUser.uid 
              : f._id !== currentUser.uid
          );
        } else {
          // Add current user to followers if following
          const currentUserData = {
            _id: currentUser.uid,
            name: currentUser.displayName || 'User',
            username: currentUser.email?.split('@')[0] || 'user',
            profileImage: currentUser.photoURL || ''
          };
          updatedFollowers.push(currentUserData);
        }
        
        return {
          ...prev,
          followers: updatedFollowers
        };
      });
      
      // Update following map for consistency across all UI elements
      setFollowingMap(prev => ({
        ...prev,
        [user._id]: newFollowingState
      }));
      
      // Update followers list if it's loaded
      if (followers.length > 0) {
        if (!newFollowingState) {
          // Remove current user from followers if unfollowing
          setFollowers(prev => prev.filter(f => f._id !== currentUser.uid));
        } else if (currentUser) {
          // Add current user to followers if following
          const currentUserData = {
            _id: currentUser.uid,
            name: currentUser.displayName || 'User',
            username: currentUser.email?.split('@')[0] || 'user',
            profileImage: currentUser.photoURL || '',
            isFollowing: false
          };
          setFollowers(prev => [currentUserData, ...prev]);
        }
      }
      
      showToast('success', newFollowingState 
        ? 'شوێنکەوتن زیاد کرا بە سەرکەوتوویی - Followed successfully'
        : 'شوێنکەوتن ڕاگیرا بە سەرکەوتوویی - Unfollowed successfully'
      );
    } catch (error: any) {
      // Only log to console if not "Cannot follow yourself"
      if (!error?.message?.includes('Cannot follow yourself')) {
        console.error('Follow toggle error:', error);
      }
      // Revert UI changes on error
      setIsFollowing(!newFollowingState);
      
      // Check if it's an "Already following" error message or "Cannot follow yourself" error
      const errorMsg = error.toString();
      if (errorMsg.includes('Already following this user')) {
        // Update UI to show following
        setFollowingMap(prev => ({
          ...prev,
          [user._id]: true
        }));
        
        // Update all UI components
        setFollowers(prev => 
          prev.map(user => 
            user._id === user._id ? { ...user, isFollowing: true } : user
          )
        );
        
        setFollowing(prev => 
          prev.map(user => 
            user._id === user._id ? { ...user, isFollowing: true } : user
          )
        );
        
        // If this is the main profile, update its state
        if (user?._id === user._id) {
          setIsFollowing(true);
        }
        
        showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
      } else if (errorMsg.includes('Cannot follow yourself')) {
        // Handle attempting to follow yourself
        setFollowingMap(prev => ({
          ...prev,
          [user._id]: false
        }));
        
        // Update UI components
        setFollowers(prev => 
          prev.map(user => 
            user._id === user._id ? { ...user, isFollowing: false } : user
          )
        );
        
        setFollowing(prev => 
          prev.map(user => 
            user._id === user._id ? { ...user, isFollowing: false } : user
          )
        );
        
        showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
      }
    } finally {
      // Clear loading state
      setFollowLoading(false);
    }
  };

  // Add fetchFollowers function
  const fetchFollowers = async () => {
    try {
      setFollowersLoading(true);
      
      // Make sure we have a valid MongoDB ObjectId before making the API call
      if (!user?._id || typeof user._id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(user._id)) {
        // Removed: console.error('Invalid MongoDB ObjectId for fetching followers:', user?._id);
        setFollowersLoading(false);
        setFollowers([]);
        return;
      }
      
      try {
        // Use API with extended cache duration
        const data = await api.get(`/api/users/${user._id}/followers`, {}, {
          useCache: true,
          cacheDuration: 15 * 60 * 1000 // 15 minutes cache
        });
      
      if (data.success) {
          // Deduplicate followers and filter out any invalid entries
          const uniqueFollowers = removeDuplicates(data.followers || [], '_id');
          setFollowers(uniqueFollowers);
          
          // REMOVED: Don't check follow status when initially loading
          // Only update follower count if needed
          if (followerCount === 0 && uniqueFollowers.length > 0) {
            setFollowerCount(uniqueFollowers.length);
          }
      } else {
          // Just show error message and set empty array - no placeholders
          showToast('error', 'Error loading followers');
          setFollowers([]);
        }
      } catch (apiError) {
        // No console log
        setFollowers([]);
        showToast('error', 'Error loading followers');
      }
    } catch (error) {
      // Removed: console.error('Error in fetchFollowers:', error);
      showToast('error', 'Error loading followers');
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  };
  
  // Add fetchFollowing function
  const fetchFollowing = async () => {
    try {
      setFollowingLoading(true);
      
      // Make sure we have a valid MongoDB ObjectId before making the API call
      if (!user?._id || typeof user._id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(user._id)) {
        // Removed: console.error('Invalid MongoDB ObjectId for fetching following:', user?._id);
        setFollowingLoading(false);
        setFollowing([]);
        return;
      }
      
      try {
        // Use API with extended cache duration
        const data = await api.get(`/api/users/${user._id}/following`, {}, {
          useCache: true,
          cacheDuration: 15 * 60 * 1000 // 15 minutes cache
        });
      
      if (data.success) {
          // Deduplicate following users and filter out any invalid entries
          const uniqueFollowing = removeDuplicates(data.following || [], '_id');
          setFollowing(uniqueFollowing);
          
          // REMOVED: Don't check follow status when initially loading
          // Mark all users in "following" list as being followed by current user
          const newFollowingMap = {...followingMap};
          uniqueFollowing.forEach(user => {
            if (user && user._id && typeof user._id === 'string') {
              newFollowingMap[user._id] = true;
            }
          });
          setFollowingMap(prev => ({...prev, ...newFollowingMap}));
        } else {
          // Just show error message and set empty array - no placeholders
          showToast('error', 'Error loading following users');
          setFollowing([]);
        }
      } catch (apiError) {
        // Removed console log
        setFollowing([]);
        showToast('error', 'Error loading following users');
      }
    } catch (error) {
      // Removed: console.error('Error in fetchFollowing:', error);
      showToast('error', 'Error loading following users');
      setFollowing([]);
    } finally {
      setFollowingLoading(false);
    }
  };
  
  // Helper function to update the following map
  const updateFollowingMap = async (users: FollowUser[]) => {
    if (!users || !Array.isArray(users) || users.length === 0) return;
    
    try {
      // More strict validation for MongoDB ObjectIDs - make sure they're 24 hex characters
      const userIds = users
        .map(u => u && u._id)
        .filter(id => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));
      
      if (userIds.length === 0) return;
      
      try {
        // Process users in smaller batches to avoid issues with any single invalid ID
        const batchSize = 10;
        const newFollowingMap: Record<string, boolean> = {};
        
        // Process userIds in batches
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batchIds = userIds.slice(i, i + batchSize);
          
          try {
            const data = await api.post('/api/users/follow/batch-status', { userIds: batchIds });
            
            if (data && data.success && data.followStatus) {
              // Add valid results to our map
              Object.entries(data.followStatus).forEach(([userId, status]) => {
                if (userId && typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
                  newFollowingMap[userId] = !!status;
                }
              });
            }
          } catch (batchError) {
            // If a batch fails, continue with the next batch
            continue;
          }
        }
        
        // Only update state if we have valid results
        if (Object.keys(newFollowingMap).length > 0) {
          setFollowingMap(prev => ({
            ...prev,
            ...newFollowingMap
          }));
        }
      } catch (apiError) {
        // Failed silently - already handled in batch processing
      }
    } catch (error) {
      // Don't throw - fail silently to avoid UI disruption
    }
  };
  
  // Function to handle follow/unfollow from the modal
  const handleModalFollowToggle = async (userId: string) => {
    if (!currentUser) {
      showToast('error', 'Please login to follow users');
      router.push('/login');
      return;
    }
    
    // Mark this user as loading
    setLoadingFollowToggle(prev => ({ ...prev, [userId]: true }));
    
    // Determine if user is already being followed
    const isCurrentlyFollowing = followingMap[userId] || false;
    const isFollowersModal = showFollowersModal;
    
    // Optimistically update UI - we'll revert if the API call fails
    const newFollowStatus = !isCurrentlyFollowing;
    
    // Update the following map right away
    setFollowingMap(prev => ({
      ...prev,
      [userId]: newFollowStatus
    }));
    
    // If we're in the following modal and unfollowing someone, remove them immediately
    if (showFollowingModal && isCurrentlyFollowing) {
      setFollowing(prev => prev.filter(user => 
        typeof user === 'string' ? user !== userId : user._id !== userId
      ));
    }
    
    // Update the followers list UI optimistically
    setFollowers(prev => 
      prev.map(user => 
        user._id === userId ? { ...user, isFollowing: newFollowStatus } : user
      )
    );
    
    // Also update the following list
    setFollowing(prev => 
      prev.map(user => 
        user._id === userId ? { ...user, isFollowing: newFollowStatus } : user
      )
    );
    
    // Determine which action to take
      const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    
    try {
      // Use the API utility for the follow/unfollow action
      // Removed: console.log(`Attempting to ${action} user with ID ${userId}`);
      const data = await api.post(`/api/users/${action}/${userId}`, {});
      
      if (!data.success) {
        // If request fails, check for specific error cases
        console.error(`${action} request failed:`, data.message);
        
        if (data.message && data.message.includes('Already following this user')) {
          // Special handling for already following error
          setFollowingMap(prev => ({
            ...prev,
            [userId]: true
          }));
          
          // Update both the followers and following list UI
          setFollowers(prev => 
            prev.map(user => 
              user._id === userId ? { ...user, isFollowing: true } : user
            )
          );
          
          setFollowing(prev => 
            prev.map(user => 
              user._id === userId ? { ...user, isFollowing: true } : user
            )
          );
          
          // If this is also the main profile we're viewing, update its state too
          if (user?._id === userId) {
            setIsFollowing(true);
          }
          
          showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
        } else if (data.message && data.message.includes('Cannot follow yourself')) {
          // Handle the "Cannot follow yourself" error
          const isUnfollowAction = isCurrentlyFollowing;
          
          if (isUnfollowAction) {
            // If we were trying to unfollow and got this error, try the request again
            console.log('Retrying unfollow action after "Cannot follow yourself" error in catch block');
            
            try {
              const retryData = await api.post(`/api/users/unfollow/${userId}`, {});
              
              if (retryData.success) {
                // Second try succeeded, update UI accordingly
      setFollowingMap(prev => ({
        ...prev,
                  [userId]: false
                }));
                
                // Update relevant UI components
                if (user?._id === userId) {
                  setIsFollowing(false);
                }
                
                // Update both lists
      setFollowers(prev => 
        prev.map(user => 
                    user._id === userId ? { ...user, isFollowing: false } : user
                  )
                );
                
                setFollowing(prev => 
                  prev.map(user => 
                    user._id === userId ? { ...user, isFollowing: false } : user
                  )
                );
                
                // If in following modal, remove the user
                if (showFollowingModal) {
                  setFollowing(prev => prev.filter(user => user._id !== userId));
                }
                
                showToast('success', 'دوور کەوتیتەوە لە بەکارهێنەر - Unfollowed user');
              } else {
                // Retry also failed, give up and revert UI
      setFollowingMap(prev => ({
        ...prev,
                  [userId]: isCurrentlyFollowing
      }));
      
                // Revert both lists
      setFollowers(prev => 
        prev.map(user => 
                    user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
                  )
                );
                
                setFollowing(prev => 
                  prev.map(user => 
                    user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
                  )
                );
                
                showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
              }
            } catch (retryError) {
              console.error('Error in retry unfollow:', retryError);
              
              // Revert UI completely
              setFollowingMap(prev => ({
                ...prev,
                [userId]: isCurrentlyFollowing
              }));
              
              // Revert both lists
              setFollowers(prev => 
                prev.map(user => 
                  user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
                )
              );
              
              setFollowing(prev => 
                prev.map(user => 
                  user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
                )
              );
              
              showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
            }
          } else {
            // Handle attempting to follow yourself
            setFollowingMap(prev => ({
              ...prev,
              [userId]: false
            }));
            
            // Update UI components
            setFollowers(prev => 
              prev.map(user => 
                user._id === userId ? { ...user, isFollowing: false } : user
              )
            );
            
            setFollowing(prev => 
              prev.map(user => 
                user._id === userId ? { ...user, isFollowing: false } : user
              )
            );
            
            showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
          }
        } else {
          // Revert all optimistic updates for other errors
          setFollowingMap(prev => ({
            ...prev,
            [userId]: isCurrentlyFollowing
          }));
          
          setFollowers(prev => 
            prev.map(user => 
              user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
            )
          );
          
          setFollowing(prev => 
            prev.map(user => 
              user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
            )
          );
          
          // If we optimistically removed from following list, add it back
          if (!newFollowStatus && showFollowingModal) {
            const userToRestore = followers.find(f => f._id === userId) || following.find(f => f._id === userId);
            if (userToRestore) {
              setFollowing(prev => [...prev, userToRestore]);
            }
          }
          
          showToast('error', `Failed to ${action} user: ${data.message}`);
        }
        
        // Clear loading state regardless of error type
        setLoadingFollowToggle(prev => ({ ...prev, [userId]: false }));
        return;
      }
      
      // Success! Make sure following map is consistent
      setFollowingMap(prev => ({
        ...prev,
        [userId]: newFollowStatus
      }));
      
      // If this is also the main profile we're viewing, update its isFollowing state too
      if (user?._id === userId) {
        setIsFollowing(newFollowStatus);
      }
      
      // If we're in the following modal and unfollowing a user, remove them from the list
      if (showFollowingModal && !newFollowStatus) {
        // Remove the unfollowed user from the following list for immediate UI update
        const beforeCount = following.length;
        setFollowing(prev => {
          const filtered = prev.filter(user => 
            typeof user === 'string' ? user !== userId : user._id !== userId
          );
          return filtered;
        });
        
        // Also update the user object if this is the current profile
        if (user?._id === userId) {
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
      }
      
      const successMsg = newFollowStatus
        ? 'ئێستا دوای بەکارهێنەر کەوتیت - Now following user'
        : 'دوور کەوتیتەوە لە بەکارهێنەر - Unfollowed user';
      
      showToast('success', successMsg);
    } catch (error: any) {
      console.error('Error toggling follow status in modal:', error);
      
      // Check for specific error cases
      const errorMsg = error.toString();
      if (errorMsg.includes('Already following this user')) {
        // Update UI to show following
        setFollowingMap(prev => ({
          ...prev,
          [userId]: true
        }));
        
        // Update all UI components
        setFollowers(prev => 
          prev.map(user => 
            user._id === userId ? { ...user, isFollowing: true } : user
          )
        );
        
        setFollowing(prev => 
          prev.map(user => 
            user._id === userId ? { ...user, isFollowing: true } : user
          )
        );
        
        // If this is the main profile, update its state
        if (user?._id === userId) {
          setIsFollowing(true);
        }
        
        showToast('info', 'ئێستا دوای ئەم بەکارهێنەرە دەکەویت - You are already following this user');
      } else if (errorMsg.includes('Cannot follow yourself')) {
        // Handle the "Cannot follow yourself" error
        const isUnfollowAction = isCurrentlyFollowing;
        
        if (isUnfollowAction) {
          // If we were trying to unfollow and got this error, try the request again
          console.log('Retrying unfollow action after "Cannot follow yourself" error in catch block');
          
          try {
            const retryData = await api.post(`/api/users/unfollow/${userId}`, {});
            
            if (retryData.success) {
              // Second try succeeded, update UI accordingly
              setFollowingMap(prev => ({
                ...prev,
                [userId]: false
              }));
              
              // Update relevant UI components
              if (user?._id === userId) {
                setIsFollowing(false);
              }
              
              // Update both lists
              setFollowers(prev => 
                prev.map(user => 
                  user._id === userId ? { ...user, isFollowing: false } : user
                )
              );
              
              setFollowing(prev => 
                prev.map(user => 
                  user._id === userId ? { ...user, isFollowing: false } : user
                )
              );
              
              // If in following modal, remove the user
              if (showFollowingModal) {
                setFollowing(prev => prev.filter(user => user._id !== userId));
              }
              
              showToast('success', 'دوور کەوتیتەوە لە بەکارهێنەر - Unfollowed user');
            } else {
              // Retry also failed, give up and revert UI
              setFollowingMap(prev => ({
                ...prev,
                [userId]: isCurrentlyFollowing
              }));
              
              // Revert both lists
              setFollowers(prev => 
                prev.map(user => 
                  user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
                )
              );
              
              setFollowing(prev => 
                prev.map(user => 
                  user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
                )
              );
              
              showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
            }
          } catch (retryError) {
            console.error('Error in retry unfollow:', retryError);
            
            // Revert UI completely
            setFollowingMap(prev => ({
              ...prev,
              [userId]: isCurrentlyFollowing
            }));
            
            // Revert both lists
            setFollowers(prev => 
              prev.map(user => 
                user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
              )
            );
            
            setFollowing(prev => 
              prev.map(user => 
                user._id === userId ? { ...user, isFollowing: isCurrentlyFollowing } : user
              )
            );
            
            showToast('error', 'کردارەکە سەرکەوتوو نەبوو - Action failed');
          }
        } else {
          // Handle attempting to follow yourself
          setFollowingMap(prev => ({
            ...prev,
            [userId]: false
          }));
          
          // Update UI components
          setFollowers(prev => 
            prev.map(user => 
              user._id === userId ? { ...user, isFollowing: false } : user
            )
          );
          
          setFollowing(prev => 
            prev.map(user => 
              user._id === userId ? { ...user, isFollowing: false } : user
            )
          );
          
          showToast('info', 'ناتوانیت فۆلۆوی خۆت بکەیت');
        }
      }
    } finally {
      // Clear loading state
      setLoadingFollowToggle(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Add handlers for showing modals
  const handleShowFollowersModal = async () => {
    if (!user) return;
    
    // First show the modal with any existing data
    setShowFollowersModal(true);
    
    // Then fetch fresh data if needed
    if (followers.length === 0) {
      await fetchFollowers();
    }
  };
  
  const handleShowFollowingModal = async () => {
    if (!user) return;
    
    // First show the modal with any existing data
    setShowFollowingModal(true);
    
    // Then fetch fresh data if needed
    if (following.length === 0) {
      await fetchFollowing();
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
          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-500 p-2 sm:p-3 rounded-lg transition-colors"
          aria-label="Twitter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
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
          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 p-2 sm:p-3 rounded-lg transition-colors"
          aria-label="Facebook"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
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
          className="bg-gray-50 hover:bg-pink-50 text-gray-500 hover:text-pink-600 p-2 sm:p-3 rounded-lg transition-colors"
          aria-label="Instagram"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
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
          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-700 p-2 sm:p-3 rounded-lg transition-colors"
          aria-label="LinkedIn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
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
          className="bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 p-2 sm:p-3 rounded-lg transition-colors"
          aria-label="GitHub"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.237 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
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
          className="bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 p-2 sm:p-3 rounded-lg transition-colors"
          aria-label="Website"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </a>
      );
    }
    
    return socialIcons.length > 0 ? socialIcons : null;
  };

  // Replace the UserAvatar component with this optimized version
  const UserAvatar = ({ user, size = 'md' }: { user: { name: string, profileImage?: string }, size?: 'sm' | 'md' | 'lg' }) => {
    // Extract initials for fallback
    const initials = user.name 
      ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : '';
      
    // State to track image loading errors  
    const [imageError, setImageError] = React.useState(false);
    
    // Size classes for different avatar sizes
    const sizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-14 h-14',
      lg: 'w-20 h-20'
    };
    
    const textClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[var(--primary)] relative flex items-center justify-center`}>
        {!imageError && user.profileImage ? (
          <Image
            src={user.profileImage}
            alt={`${user.name} avatar`}
            fill
            style={{ objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={`${textClasses[size]} font-bold text-white`}>{initials}</span>
        )}
      </div>
    );
  };

  // Helper function to remove duplicates from an array by key
  const removeDuplicates = (array: any[], key: string) => {
    // Return empty array for invalid inputs
    if (!array || !Array.isArray(array)) return [];
    
    const seen = new Set();
    return array.filter(item => {
      // Basic validation - item must exist and have the key
      if (!item || !item[key]) return false;
      
      // For _id fields, do additional MongoDB ObjectId validation
      if (key === '_id' && typeof item[key] === 'string') {
        // Validate MongoDB ObjectId format (24 hex characters)
        if (!/^[0-9a-fA-F]{24}$/.test(item[key])) {
          // Removed: console.log('Filtering invalid MongoDB ObjectId:', item[key]);
          return false;
        }
      }
      
      const value = item[key];
      // Check for duplicates
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  };

  const isBackblazeUrl = (url: string | undefined) => {
    if (!url) return false;
    // Adjust this check to match your Backblaze URL pattern
    return url.startsWith('https://') && !url.includes('/images/');
  };

  const getProfileImageUrl = (user: UserProfile) => {
    if (user.userImage?.profileImage && isBackblazeUrl(user.userImage.profileImage)) {
      return user.userImage.profileImage;
    }
    if (user.profileImage && isBackblazeUrl(user.profileImage)) {
      return user.profileImage;
    }
    return null;
  };

  const getBannerImageUrl = (user: UserProfile) => {
    if (user.userImage?.bannerImage && isBackblazeUrl(user.userImage.bannerImage)) {
      return user.userImage.bannerImage;
    }
    if (user.bannerImage && isBackblazeUrl(user.bannerImage)) {
      return user.bannerImage;
    }
    // Fallback to the new Backblaze B2 default
    return 'https://f005.backblazeb2.com/file/bnusa-images/banners/9935e1b6-4094-45b9-aafd-05ea6c6a1816.jpg';
  };

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
          
          // (console.log removed)
        }
      }
    };
    
    if (user) {
      burstImageCache();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          بەکارهێنەر نەدۆزرایەوە
        </h1>
        <p className="text-[var(--grey-dark)] mb-8">
          ببورە، ناتوانین ئەم بەکارهێنەرە بدۆزینەوە. تکایە دواتر هەوڵ بدەرەوە یان بگەڕێوە بۆ پەڕەی سەرەکی.
        </p>
        <Link href="/" className="btn btn-primary">
          گەڕانەوە بۆ پەڕەی سەرەکی
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 md:h-80">
        {getBannerImageUrl(user) ? (
          <ImageWithFallback
            src={getBannerImageUrl(user)}
            alt="Profile banner"
            fill
            style={{ objectFit: 'cover' }}
            className=""
            sizes="100vw"
            priority
          />
        ) : null}
      </div>

      {/* Profile Info with optimized avatar */}
      <div className="container mx-auto px-4 relative">
        <div className="bg-white rounded-lg -mt-8 sm:-mt-12 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            {/* Profile Image */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full border-4 border-white overflow-hidden flex-shrink-0 mx-auto md:mx-0 -translate-y-8 -mb-1">
              {getProfileImageUrl(user) ? (
                <ImageWithFallback
                  src={getProfileImageUrl(user) || ''}
                  alt={user.name}
                  fill
                  className="w-full h-full object-cover"
                  sizes="128px"
                />
              ) : null}
            </div>

            {/* User Info */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{user.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <p className="text-[var(--grey-dark)]">@{user.username}</p>
                    {console.log('User roles:', { isWriter: user.isWriter, isSupervisor: user.isSupervisor, isDesigner: user.isDesigner })}
                    {user.isWriter && (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="w-3 h-3 mr-0.5 sm:mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        <span className="whitespace-nowrap">نووسەر</span>
                      </span>
                    )}
                    {user.isSupervisor === true && (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-0.5 sm:mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                        </svg>
                        <span className="whitespace-nowrap">سەرپەرشتیار</span>
                      </span>
                    )}
                    {user.isDesigner === true && (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <svg className="w-3 h-3 mr-0.5 sm:mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                        </svg>
                        <span className="whitespace-nowrap">دیزاینەر</span>
                      </span>
                    )}
                  </div>
                  
                  {/* Follow button - only show if not viewing own profile and both users are loaded */}
                  {!loading && currentUser && user && !isOwnProfile && (
                    <div className="flex flex-col md:flex-row gap-2 sm:gap-4 mb-4">
                      <button
                        className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-all duration-300 min-w-[100px] sm:min-w-[130px] text-sm sm:text-base ${
                          isFollowing
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                            : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white'
                        }`}
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                      >
                        {followLoading ? (
                          <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : isFollowing ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <span className="whitespace-nowrap">دووری بکەوەوە</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
                            </svg>
                            <span className="whitespace-nowrap">دوای بکەوە</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3 sm:gap-6 mt-3 md:mt-0">
                  <button
                    className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 rounded-xl flex items-center gap-2.5 sm:gap-3 lg:gap-4 transition-all duration-300 text-sm sm:text-base font-medium"
                    aria-label="Show followers"
                    onClick={handleShowFollowersModal}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 text-blue-600 relative z-10" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-lg sm:text-xl lg:text-xl text-gray-800 group-hover:text-blue-700 transition-colors duration-300">{user.followers.length}</span> 
                      <span className="text-blue-600 text-xs sm:text-sm font-medium">شوێنکەوتوو</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  </button>
                  
                  <button
                    className="group relative bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 hover:border-purple-300 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 rounded-xl flex items-center gap-2.5 sm:gap-3 lg:gap-4 transition-all duration-300 text-sm sm:text-base font-medium"
                    aria-label="Show following"
                    onClick={handleShowFollowingModal}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 text-purple-600 relative z-10" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-lg sm:text-xl lg:text-xl text-gray-800 group-hover:text-purple-700 transition-colors duration-300">{user?.following?.length || 0}</span> 
                      <span className="text-purple-600 text-xs sm:text-sm font-medium">شوێنکەوتن</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  </button>
                </div>
              </div>

              {user.bio && <p className="text-[var(--grey-dark)] mb-4 text-sm sm:text-base break-words">{user.bio}</p>}
              
              {/* Role-specific information */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {user.isSupervisor && user.supervisorText && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-green-800 text-sm flex-grow">
                    <div className="flex items-center flex-wrap">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                      </svg>
                      <span className="break-words">{user.supervisorText}</span>
                    </div>
                  </div>
                )}
                
                {user.isDesigner && user.designsCount !== undefined && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-purple-800 text-sm flex-grow">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                      </svg>
                      <span>{user.designsCount} دیزاین</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              <div className="mt-4 sm:mt-5">
                <h3 className="text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  پەیوەندی:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {renderSocialMedia()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More sections can be added here according to requirements - like recent activities, comments, etc. */}
      <div className="container mx-auto py-6 sm:py-8 md:py-12 px-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">وتارەکانی {user.name} <span className="text-base text-gray-500 font-normal">({publishedArticlesCount})</span></h2>
        
        {!publishedArticles || publishedArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8 text-center">
          <p className="text-[var(--grey-dark)] text-sm sm:text-base">
              هیچ وتارێک نییە بۆ پیشاندان.
          </p>
        </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {publishedArticles
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((article) => (
              <ArticleCard
                key={article._id}
                title={article.title}
                description={article.description}
                slug={article.slug}
                categories={article.categories}
                coverImage={article.coverImage}
                author={{
                  name: user.name,
                  username: user.username,
                  profileImage: user.profileImage,
                  isWriter: user.isWriter,
                  isSupervisor: user.isSupervisor,
                  isDesigner: user.isDesigner
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Use the UserListModal component for Followers */}
      {showFollowersModal && (
        <UserListModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          title="شوێنکەوتوان - Followers"
          users={followers.filter(follower => follower._id && /^[0-9a-fA-F]{24}$/.test(follower._id))}
          emptyMessage="هیچ شوێنکەوتوویەک نییە - No followers yet"
          currentUserId={currentUser?.uid}
          onFollowToggle={handleModalFollowToggle}
          followingMap={followingMap}
          followLoading={loadingFollowToggle}
          isFollowersList={true}
          hideButtons={true}
        />
      )}

      {/* Use the UserListModal component for Following */}
      {showFollowingModal && (
        <UserListModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          title="شوێنکەوتن - Following"
          users={following.filter(followedUser => followedUser._id && /^[0-9a-fA-F]{24}$/.test(followedUser._id))}
          emptyMessage="هیچ شوێنکەوتنێک نییە - Not following anyone yet"
          currentUserId={currentUser?.uid}
          onFollowToggle={handleModalFollowToggle}
          followingMap={followingMap}
          followLoading={loadingFollowToggle}
          isFollowersList={false}
          hideButtons={true}
        />
      )}
    </div>
  );
} 