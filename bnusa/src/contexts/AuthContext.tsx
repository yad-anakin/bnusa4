import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { generateProfileImage } from '../utils/profileImageGenerator';
import api from '../utils/api';

// Define the authentication context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Create a hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up auth state listener when the component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'نەتوانرا بچیتە ژوورەوە');
      throw err;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      // Generate a profile image with icon on purple background
      const profileImageUrl = generateProfileImage();
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's profile with the display name and generated profile image
      if (result.user) {
        await updateProfile(result.user, {
          displayName: displayName,
          photoURL: profileImageUrl
        });
        
        // Also store the profile image in MongoDB for consistency
        try {
          await api.post('/api/users/profile', {
            name: displayName,
            profileImage: profileImageUrl,
            // Set a default banner image too
            bannerImage: 'https://f005.backblazeb2.com/file/bnusa-images/banners/9935e1b6-4094-45b9-aafd-05ea6c6a1816.jpg'
          });
        } catch (dbErr) {
          console.error('Failed to save profile image to database', dbErr);
          // Continue despite this error - the photoURL is set in Firebase Auth
        }
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'سەرکەوتوو نەبوو لە دروستکردنی هەژمار');
      throw err;
    }
  };

  // Sign out function
  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      setError(err.message || 'سەرکەوتوو نەبوو لە دەرچوون');
      throw err;
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message || 'سەرکەوتوو نەبوو لە گەڕاندنەوەی وشەی نهێنی');
      throw err;
    }
  };

  // Sign in with Google function
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'سەرکەوتوو نەبوو لە چوونە ژوورەوە بە Google');
      throw err;
    }
  };

  // Update user profile function
  const updateUserProfile = async (displayName: string, photoURL: string) => {
    setError(null);
    try {
      if (!currentUser) throw new Error('هیچ بەکارهێنەرێک نییە');
      
      // Update Firebase profile directly using updateProfile
      console.log(`Updating Firebase profile for ${currentUser.email} with:`, { displayName, photoURL });
      
      try {
        // First method: direct update
        await updateProfile(currentUser, {
          displayName,
          photoURL
        });
        
        // Record success
        console.log('Firebase profile updated successfully with direct method');
      } catch (updateError) {
        console.error('Error in direct profile update:', updateError);
        throw updateError; // Let the caller handle this error
      }
      
      // Update our local state to reflect changes - don't try to reload the user
      // which can cause getIdToken errors
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        
        // This is a safer way to update the user object without triggering getIdToken
        const updatedUser = Object.assign({}, prevUser);
        Object.defineProperties(updatedUser, {
          'displayName': { value: displayName, writable: true, configurable: true },
          'photoURL': { value: photoURL, writable: true, configurable: true }
        });
        
        return updatedUser;
      });
      
      // Log success
      console.log('Auth context updated with new profile:', { displayName, photoURL });
      
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setError(err.message || 'سەرکەوتوو نەبوو لە نوێکردنەوەی پرۆفایل');
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 