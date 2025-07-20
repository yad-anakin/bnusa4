import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  username?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  // Add any additional user fields here
}

/**
 * Creates or updates a user profile in Firestore
 */
export const saveUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create new user
    await setDoc(userRef, {
      uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update existing user
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Gets a user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
};

/**
 * Gets a user profile by username
 */
export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as UserProfile;
  }
  
  return null;
};

/**
 * Checks if a username is available (not taken)
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const user = await getUserByUsername(username);
  return user === null;
}; 