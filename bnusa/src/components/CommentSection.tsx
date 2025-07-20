'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import ImageWithFallback from './ImageWithFallback';

interface CommentType {
  _id: string;
  content: string;
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    profileImage: string;
    firebaseUid?: string;
  };
  replies: ReplyType[];
  replyCount?: number;
  replyingTo?: {
    _id: string;
    username: string;
  };
}

interface ReplyType {
  _id: string;
  content: string;
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    profileImage: string;
    firebaseUid?: string;
  };
  replies: ReplyType[];
  replyCount?: number;
  replyingTo?: {
    _id: string;
    username: string;
  };
}

interface CommentSectionProps {
  articleId: string;
  articleOwnerId: string;
}

interface CurrentUserProfile {
  _id: string;
  firebaseUid: string;
  name: string;
  username: string;
  email: string;
}

export default function CommentSection({ articleId, articleOwnerId }: CommentSectionProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [deletingComments, setDeletingComments] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [replyFocused, setReplyFocused] = useState(false);
  
  // Reply pagination state
  const [replyPages, setReplyPages] = useState<{ [commentId: string]: number }>({});
  const [replyHasMore, setReplyHasMore] = useState<{ [commentId: string]: boolean }>({});
  const [loadingReplies, setLoadingReplies] = useState<{ [commentId: string]: boolean }>({});
  
  // Ref for main comment input
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Ref for reply input
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user's MongoDB profile
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!isAuthenticated || !currentUser) return;
      
      try {
        setLoadingUserProfile(true);
        const response = await api.get('/api/users/profile');
        if (response.success && response.user) {
          setCurrentUserProfile(response.user);
        }
      } catch (error) {
        console.error('Error fetching current user profile:', error);
      } finally {
        setLoadingUserProfile(false);
      }
    };

    fetchCurrentUserProfile();
  }, [isAuthenticated, currentUser]);

  // Get numeric article ID if possible
  const getNumericArticleId = () => {
    // If articleId is already a number, return it
    if (typeof articleId === 'number') {
      return articleId;
    }
    
    // If it's a string that can be parsed as a number, return the number
    const numericId = Number(articleId);
    if (!isNaN(numericId)) {
      return numericId;
    }
    
    // Otherwise, use a fallback numeric ID (e.g., hash the string)
    // This is a simple hash function to convert string to number
    let hash = 0;
    const str = String(articleId);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ku-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Removed auto-focus to prevent page scrolling to comment section



  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const numericArticleId = getNumericArticleId();
        const response = await api.get(`/api/comments/${numericArticleId}?page=${page}&limit=5`);
        
        if (response.success) {
          setComments(prev => page === 1 ? response.data : [...prev, ...response.data]);
          setHasMore(response.pagination.hasMore);
          setTotalComments(response.pagination.totalComments);
        } else {
          setError('Failed to load comments');
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Error loading comments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [articleId, page]);

  // Load more comments
  const loadMoreComments = () => {
    setPage(prev => prev + 1);
  };

  // Load more replies for a specific comment
  const loadMoreReplies = (commentId: string) => {
    loadReplies(commentId, true);
  };

  // Calculate total comments including replies (memoized)
  const calculateTotalComments = React.useMemo(() => {
    let total = totalComments; // Start with top-level comments
    
    // Add all replies from all comments using replyCount from API
    for (const comment of comments) {
      total += comment.replyCount || 0;
    }
    
    return total;
  }, [totalComments, comments]);



  // Submit a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please sign in to post a comment');
      return;
    }
    
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const numericArticleId = getNumericArticleId();
      const response = await api.post('/api/comments', {
        articleId: numericArticleId,
        content: newComment
      });
      
      if (response.success) {
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
        setTotalComments(prev => prev + 1);
      } else {
        setError(response.message || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Error posting comment. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Load replies for a comment
  const loadReplies = async (commentId: string, loadMore: boolean = false) => {
    // Toggle expanded state if not loading more
    if (!loadMore) {
      const isCurrentlyExpanded = expandedReplies.includes(commentId);
      
      if (isCurrentlyExpanded) {
        // Hide replies
        setExpandedReplies(prev => prev.filter(id => id !== commentId));
        return;
      }
    }
    
    // Check if replies are already loaded and we're not loading more
    const comment = comments.find(c => c._id === commentId);
    if (!loadMore && comment && comment.replies && comment.replies.length > 0) {
      // Replies are already loaded, just show them
      setExpandedReplies(prev => [...prev, commentId]);
      return;
    }
    
    // Set loading state
    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    
    // Get current page for this comment
    const currentPage = replyPages[commentId] || 1;
    const pageToLoad = loadMore ? currentPage + 1 : 1;
    
    // Fetch replies from the backend
    try {
      const response = await api.get(`/api/comments/replies/${commentId}?page=${pageToLoad}&limit=50`);
      
      if (response.success) {
        // Fetch nested replies for each reply recursively
        const fetchNestedRepliesRecursively = async (reply: any): Promise<any> => {
          try {
            const nestedResponse = await api.get(`/api/comments/replies/${reply._id}?limit=50`);
            if (nestedResponse.success && nestedResponse.data.length > 0) {
              // Recursively fetch nested replies for each nested reply
              const nestedRepliesWithDeepNesting = await Promise.all(
                nestedResponse.data.map(async (nestedReply: any) => {
                  return await fetchNestedRepliesRecursively(nestedReply);
                })
              );
              return { ...reply, replies: nestedRepliesWithDeepNesting };
            }
          } catch (err) {
            // No nested replies found
          }
          return { ...reply, replies: [] };
        };

        const repliesWithNested = await Promise.all(
          response.data.map(async (reply: any) => {
            return await fetchNestedRepliesRecursively(reply);
          })
        );
        
        // Update the comment with the fetched replies
        setComments(prev => 
          prev.map(comment => 
            comment._id === commentId 
              ? { 
                  ...comment, 
                  replies: loadMore 
                    ? [...(comment.replies || []), ...repliesWithNested]
                    : repliesWithNested 
                } 
              : comment
          )
        );
        
        // Update pagination state
        setReplyPages(prev => ({ ...prev, [commentId]: pageToLoad }));
        setReplyHasMore(prev => ({ ...prev, [commentId]: response.pagination.hasMore }));
        
        // Show the replies if not loading more
        if (!loadMore) {
          setExpandedReplies(prev => [...prev, commentId]);
        }
      } else {
        setError('Failed to load replies');
      }
    } catch (err) {
      console.error('Error fetching replies:', err);
      setError('Error loading replies. Please try again later.');
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // Toggle reply form
  const toggleReplyForm = (commentId: string, username: string) => {
    if (!isAuthenticated) {
      setError('Please sign in to reply');
      return;
    }
    
    // Close all other reply forms first
    // This logic needs to be adapted to handle nested replies
    // For now, we'll just toggle the current one
    setReplyingTo(commentId);
    
    // Focus the reply input after a short delay to ensure the form is rendered
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 100);
  };

  // Hide reply form
  const hideReplyForm = (commentId: string) => {
    setReplyingTo(null);
    setReplyText('');
    setReplyFocused(false);
  };

  // Submit a reply
  const handleSubmitReply = async (commentId: string) => {
    if (!isAuthenticated) {
      setError('Please sign in to post a reply');
      return;
    }
    
    if (!replyText.trim()) {
      setError('Reply cannot be empty');
      return;
    }
    
    try {
      setSubmittingReply(true);
      setError(null);
      
      const numericArticleId = getNumericArticleId();
      const response = await api.post('/api/comments', {
        articleId: numericArticleId,
        parentId: commentId,
        content: replyText
      });
      
      if (response.success) {
        // Ensure the reply data has the correct structure
        const replyData = {
          ...response.data,
          replies: response.data.replies || [],
          replyCount: response.data.replyCount || 0,
          // Ensure replyingTo field is properly structured
          replyingTo: response.data.replyingTo ? {
            _id: response.data.replyingTo._id,
            username: response.data.replyingTo.username
          } : undefined
        };
        
        // Add the new reply to the correct parent
        setComments(prev => {
          const newComments = [...prev];
          
          // Helper function to check if a reply ID exists in the replies tree
          const findReplyInTree = (replies: ReplyType[], targetId: string): boolean => {
            for (const reply of replies) {
              if (reply._id === targetId) {
                return true;
              }
              if (reply.replies && reply.replies.length > 0) {
                if (findReplyInTree(reply.replies, targetId)) {
                  return true;
                }
              }
            }
            return false;
          };
          
          // Recursive function to add reply to the correct nested location
          const addReplyToNestedLocation = (replies: ReplyType[], targetId: string): ReplyType[] => {
            return replies.map(reply => {
              if (reply._id === targetId) {
                // Found the target reply, add the new reply to its replies array
                const currentNestedReplies = reply.replies || [];
                const newNestedReplies = [replyData, ...currentNestedReplies];
                
                return {
                  ...reply,
                  replies: newNestedReplies,
                  replyCount: (reply.replyCount || 0) + 1
                };
              } else if (reply.replies && reply.replies.length > 0) {
                // Check nested replies recursively
                const updatedReplies = addReplyToNestedLocation(reply.replies, targetId);
                // If a nested reply was found and updated, increment this reply's count
                if (updatedReplies !== reply.replies) {
                  return {
                    ...reply,
                    replies: updatedReplies,
                    replyCount: (reply.replyCount || 0) + 1
                  };
                }
                return {
                  ...reply,
                  replies: updatedReplies
                };
              }
              return reply;
            });
          };
          
          // First, check if this is a reply to a nested reply
          let foundInNested = false;
          const updatedComments = newComments.map(comment => {
            if (comment.replies && comment.replies.length > 0) {
              // Check if the commentId is actually a reply ID in this comment's replies
              const isReplyId = findReplyInTree(comment.replies, commentId);
              
              if (isReplyId) {
                const updatedReplies = addReplyToNestedLocation(comment.replies, commentId);
                if (updatedReplies !== comment.replies) {
                  // A nested reply was found and updated
                  foundInNested = true;
                  // Increment the main comment's replyCount since a nested reply was added
                  return { 
                    ...comment, 
                    replies: updatedReplies,
                    replyCount: (comment.replyCount || 0) + 1
                  };
                }
              }
            }
            return comment;
          });
          
          // If not found in nested replies, it must be a reply to a top-level comment
          if (!foundInNested) {
            // Find the comment to add the reply to
            const commentIndex = updatedComments.findIndex(c => c._id === commentId);
            
            if (commentIndex !== -1) {
              const currentComment = updatedComments[commentIndex];
              const currentReplies = currentComment.replies || [];
              
              // Add the new reply to the top (newest first)
              const newReplies = [replyData, ...currentReplies];
              
              // Update the comment with the new replies
              updatedComments[commentIndex] = {
                ...currentComment,
                replies: newReplies,
                replyCount: (currentComment.replyCount || 0) + 1
              };
            }
          }
          
          return updatedComments;
        });
        
        // Automatically expand replies for the comment that received the reply
        setExpandedReplies(prev => {
          if (!prev.includes(commentId)) {
            return [...prev, commentId];
          }
          return prev;
        });
        
        // No need for forced re-render - state updates are sufficient
        
        // Clear the reply content and hide the form
        setReplyText('');
        setReplyingTo(null);
        setReplyFocused(false);
      } else {
        setError(response.message || 'Failed to post reply');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('Error posting reply. Please try again later.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Delete a comment
  const handleDeleteClick = (commentId: string) => {
    setConfirmDeleteId(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!confirmDeleteId) return;
    const commentId = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!isAuthenticated) {
      setError('Please sign in to delete a comment');
      return;
    }
    
    try {
      setDeletingComments((prev) => [...prev, commentId]);
      
      // Pass additional context to help backend verify permissions
      const deleteData = {
        articleId: getNumericArticleId(),
        articleOwnerId: articleOwnerId,
        userMongoId: currentUserProfile?._id
      };
      
      // Build query string for additional data
      const queryParams = new URLSearchParams({
        articleId: deleteData.articleId.toString(),
        articleOwnerId: deleteData.articleOwnerId,
        userMongoId: deleteData.userMongoId || ''
      }).toString();
      
      const response = await api.delete(`/api/comments/${commentId}?${queryParams}`);
      
      if (response.success) {
        setTimeout(() => {
          // Remove the comment/reply from the state
          setComments(prev => {
            const newComments = [...prev];
            
            // Recursive function to remove reply from nested location
            const removeReplyFromNestedLocation = (replies: ReplyType[], targetId: string): ReplyType[] => {
              return replies.filter(reply => reply._id !== targetId).map(reply => {
                if (reply.replies && reply.replies.length > 0) {
                  return {
                    ...reply,
                    replies: removeReplyFromNestedLocation(reply.replies, targetId)
                  };
                }
                return reply;
              });
            };
            
            // Check if it's a top-level comment
            const isTopLevelComment = newComments.some(comment => comment._id === commentId);
            
            if (isTopLevelComment) {
              // Remove top-level comment
              return newComments.filter(comment => comment._id !== commentId);
            } else {
              // Remove nested reply
              return newComments.map(comment => {
                if (comment.replies && comment.replies.length > 0) {
                  const updatedReplies = removeReplyFromNestedLocation(comment.replies, commentId);
                  if (updatedReplies.length !== comment.replies.length) {
                    // A reply was removed
                    return { ...comment, replies: updatedReplies };
                  }
                }
                return comment;
              });
            }
          });
          
          setTotalComments(prev => prev - 1);
          setReplyText(''); // Clear reply text if it was a reply
          setReplyingTo(null); // Hide reply form
          setDeletingComments((prev) => prev.filter(id => id !== commentId));
        }, 400);
      } else {
        setDeletingComments((prev) => prev.filter(id => id !== commentId));
        setError(response.message || 'Failed to delete comment');
      }
    } catch (err) {
      setDeletingComments((prev) => prev.filter(id => id !== commentId));
      console.error('Error deleting comment:', err);
      setError('Error deleting comment. Please try again later.');
    }
  };
  const cancelDeleteComment = () => {
    setConfirmDeleteId(null);
  };

  // Check if user can delete a comment - memoized
  const canDeleteComment = React.useCallback((comment: CommentType) => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }
    
    // Comment owner can delete their own comment
    if (comment.userId.firebaseUid === currentUser.uid) {
      return true;
    }
    
    // Article owner can delete any comment on their article
    // Compare MongoDB IDs: currentUserProfile._id with articleOwnerId
    if (currentUserProfile && currentUserProfile._id === articleOwnerId) {
      return true;
    }
    
    return false;
  }, [isAuthenticated, currentUser?.uid, currentUserProfile?._id, articleOwnerId]);

  // Flatten all replies (including nested) for a comment - memoized
  const flattenReplies = React.useCallback((parentId: string): CommentType[] => {
    const parentComment = comments.find(c => c._id === parentId);
    
    if (!parentComment || !parentComment.replies) {
      return [];
    }
    
    const result: CommentType[] = [];
    const traverse = (replies: CommentType[]) => {
      for (const reply of replies) {
        result.push(reply);
        if (reply.replies && reply.replies.length > 0) {
          traverse(reply.replies);
        }
      }
    };
    traverse(parentComment.replies);
    
    return result;
  }, [comments]);

  // Comment Item Component - memoized to prevent unnecessary re-renders
  const CommentItem = React.memo<{ 
    comment: CommentType; 
    isReply?: boolean;
  }>(({ comment, isReply = false }) => {
    const isDeleting = deletingComments.includes(comment._id);
    
    return (
      <div className={`border-b border-gray-100 py-4 transition-all duration-400 ease-in-out ${isDeleting ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`} style={{ transition: 'opacity 0.4s, transform 0.4s' }}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden relative">
              <ImageWithFallback
                src={comment.userId.profileImage}
                alt={comment.userId.name || ''}
                fill
                style={{ objectFit: 'cover' }}
                placeholderSize="avatar"
                placeholderType="primary"
                initials={(comment.userId.name || '').substring(0, 2)}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">{comment.userId.name}</h4>
                <p className="text-xs text-gray-500">@{comment.userId.username}</p>
              </div>
              <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
            </div>
            
            {/* Show "Replying to @username" for replies */}
            {isReply && comment.replyingTo && comment.replyingTo.username && (
              <p className="text-xs text-[var(--primary)] mt-1">
                وەڵامدانەوە بۆ @{comment.replyingTo.username}
              </p>
            )}
            
            <p className="text-sm mt-1">{comment.content}</p>
            
            <div className="flex items-center mt-2 gap-4">
              <button
                onClick={() => toggleReplyForm(comment._id, comment.userId.username)}
                className="text-xs text-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              >
                وەڵامدانەوە
              </button>
              
              {/* Show replies button only for main comments, not for replies */}
              {!isReply && (
                <button
                  onClick={() => loadReplies(comment._id)}
                  className="text-xs text-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center gap-1"
                >
                  {expandedReplies.includes(comment._id) ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      شاردنەوەی وەڵامەکان
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {comment.replyCount && comment.replyCount > 0
                        ? `بینینی ${comment.replyCount} وەڵام`
                        : 'بینینی وەڵامەکان'
                      }
                    </>
                  )}
                </button>
              )}
              
              {/* Delete button - only show if user can delete */}
              {canDeleteComment(comment) && (
                <button
                  onClick={() => handleDeleteClick(comment._id)}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  سڕینەوە
                </button>
              )}
            </div>
            
            {/* Simple reply form */}
            {replyingTo === comment._id && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-[var(--primary)] mb-2">
                  وەڵامدانەوە بۆ @{comment.userId.username}
                </p>
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setReplyFocused(true)}
                  placeholder="وەڵامەکەت بنووسە..."
                  className="w-full border border-gray-200 rounded-lg p-3 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                  disabled={submittingReply}
                  autoFocus
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => hideReplyForm(comment._id)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitReply(comment._id)}
                    disabled={submittingReply}
                    className="bg-[var(--primary)] text-white px-3 py-1 text-xs rounded-lg hover:bg-[var(--primary-light)] disabled:opacity-50"
                  >
                    {submittingReply ? 'بارکردن...' : 'ناردن'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="w-full mt-8">
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold">کۆمێنتەکان ({calculateTotalComments})</h2>
      </div>
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {/* Comment Form */}
      <div className="py-4 border-b border-gray-200">
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="w-full">
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden relative border border-gray-200">
                  <ImageWithFallback
                    src={currentUser?.photoURL || ''}
                    alt={currentUser?.displayName || 'User'}
                    fill
                    style={{ objectFit: 'cover' }}
                    placeholderSize="avatar"
                    placeholderType="primary"
                    initials={(currentUser?.displayName || 'U').substring(0, 2)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="کۆمێنتەکەت بنووسە..."
                  className="w-full border border-gray-200 rounded-lg p-4 focus:ring-[var(--primary)] focus:border-transparent text-sm bg-white transition-all min-h-[60px]"
                  style={{ direction: 'rtl', textAlign: 'right' }}
                  disabled={submitting}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-[var(--primary)] text-white px-5 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'بارکردن...' : 'ناردنی کۆمێنت'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-2">بۆ نووسینی کۆمێنت، پێویستە بچیتە ژوورەوە</p>
            <a
              href="/login"
              className="inline-block bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors text-sm"
            >
              چوونە ژوورەوە
            </a>
          </div>
        )}
      </div>
      {/* Comments List */}
      <div className="divide-y divide-gray-200">
        {loading && comments.length === 0 ? (
          <div className="py-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">بارکردنی کۆمێنتەکان...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">هیچ کۆمێنتێک نییە. یەکەم کەس بە بۆ نووسینی کۆمێنت!</p>
          </div>
        ) : (
          <div>
            {comments.map((comment) => (
              <div key={comment._id} className="w-full">
                {/* Main comment */}
                <CommentItem comment={comment} />
                {/* Replies - all shown at the same level with "replying to" text */}
                {expandedReplies.includes(comment._id) && (
                  <div className="mt-2 pl-6 border-l-2 border-gray-100 bg-gray-50">
                    {(() => {
                      const flattenedReplies = flattenReplies(comment._id);
                      const isLoading = loadingReplies[comment._id];
                      const hasMoreReplies = replyHasMore[comment._id];
                      return (
                        <>
                          {flattenedReplies.length > 0 ? (
                            flattenedReplies.map(reply => (
                              <CommentItem key={reply._id} comment={reply} isReply />
                            ))
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-sm text-gray-500">هیچ وەڵامێک نییە. یەکەم کەس بە بۆ نووسینی وەڵام!</p>
                            </div>
                          )}
                          {hasMoreReplies && (
                            <div className="py-3 text-center">
                              <button
                                onClick={() => loadMoreReplies(comment._id)}
                                disabled={isLoading}
                                className="bg-gray-100 text-[var(--primary)] px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs"
                              >
                                {isLoading ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                                    <span>بارکردن...</span>
                                  </div>
                                ) : (
                                  'وەڵامی زیاتر'
                                )}
                              </button>
                            </div>
                          )}
                          {isLoading && flattenedReplies.length === 0 && (
                            <div className="py-4 text-center">
                              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                              <p className="mt-2 text-xs text-gray-500">بارکردنی وەڵامەکان...</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
            {hasMore && (
              <div className="py-4 text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="bg-gray-100 text-[var(--primary)] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'بارکردن...' : 'کۆمێنتی زیاتر'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs mx-auto animate-fade-in">
            <h3 className="text-lg font-bold mb-2 text-gray-800 text-center">سڕینەوەی کۆمێنت</h3>
            <p className="text-gray-600 text-sm mb-4 text-center">دڵنیایت دەتەوێت ئەم کۆمێنتە بسڕیتەوە؟ ئەم کردارە گەڕانەوەی نییە.</p>
            <div className="flex justify-between gap-2 mt-4">
              <button
                onClick={cancelDeleteComment}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-[var(--primary)] hover:bg-gray-100 transition-colors"
              >پاشگەزبوونەوە</button>
              <button
                onClick={confirmDeleteComment}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >سڕینەوە</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 