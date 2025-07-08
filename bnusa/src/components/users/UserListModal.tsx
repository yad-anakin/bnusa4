'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

interface UserItem {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
  isWriter?: boolean;
  userImage?: {
    profileImage: string;
    bannerImage: string;
  };
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: UserItem[];
  emptyMessage: string;
  currentUserId?: string;
  onFollowToggle?: (userId: string) => Promise<void>;
  followingMap?: Record<string, boolean>;
  followLoading?: Record<string, boolean>;
  isFollowersList?: boolean;
  hideButtons?: boolean;
}

const UserListModal: React.FC<UserListModalProps> = ({
  isOpen,
  onClose,
  title,
  users,
  emptyMessage,
  currentUserId,
  onFollowToggle,
  followingMap = {},
  followLoading = {},
  isFollowersList = false,
  hideButtons = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Function to determine the correct route for a user
  const getUserProfileRoute = (user: UserItem) => {
    return user.isWriter ? `/writers/${user.username}` : `/users/${user.username}`;
  };

  // Add a helper function to get the profile image URL
  const getProfileImageUrl = (user: UserItem) => {
    // Always prefer the userImage data if available
    if (user.userImage?.profileImage) {
      return `${user.userImage.profileImage}?t=${Date.now()}`;
    }
    
    // Fall back to user's direct profileImage field
    return `${user.profileImage || '/images/default-avatar.png'}?t=${Date.now()}`;
  };

  const isBackblazeUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('https://') && !url.includes('/images/');
  };

  const renderButton = (userId: string) => {
    // Don't render buttons for the current user (viewing themselves)
    if (currentUserId && userId === currentUserId) {
      return null;
    }

    // If no onFollowToggle function is provided or if hideButtons is true, don't show button
    if (!onFollowToggle || hideButtons) {
      return null;
    }
    
    // Determine button text based on current following status and which list we're in
    let buttonText = "";
    if (followingMap[userId] === true) {
      buttonText = "دووری بکەوەوە"; // Unfollow
    } else {
      buttonText = "دوای بکەوە"; // Follow
    }

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFollowToggle(userId);
        }}
        disabled={followLoading[userId]}
        className={`
          text-center py-1 px-3 rounded-full text-sm min-w-[120px]
          ${followingMap[userId] === true
            ? 'border border-gray-300 hover:bg-gray-100'
            : 'bg-blue-500 text-white hover:bg-blue-600'
          }
          ${followLoading[userId] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {followLoading[userId] ? (
          <span className="flex justify-center items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>...</span>
          </span>
        ) : (
          buttonText
        )}
      </button>
    );
  };

  // Only show users with valid MongoDB ObjectIDs
  const validUsers = users.filter(u => typeof u._id === 'string' && /^[0-9a-fA-F]{24}$/.test(u._id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 flex-grow">
          {validUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <ul className="divide-y">
              {validUsers.map(user => (
                <li key={user._id} className="py-3 flex items-center justify-between">
                  <Link 
                    href={getUserProfileRoute(user)}
                    className="flex items-center gap-3 flex-grow"
                    onClick={(e) => {
                      // Close the modal before navigating
                      onClose();
                    }}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--primary)] flex items-center justify-center text-white">
                      {isBackblazeUrl(user.userImage?.profileImage || user.profileImage) ? (
                        <img
                          src={user.userImage?.profileImage || user.profileImage}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-medium">{user.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        @{user.username}
                        {user.isWriter && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            نووسەر
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                  
                  {renderButton(user._id)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal; 