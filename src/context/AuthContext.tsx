import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error: any) {
      const code = error?.code || '';
      // Normal user dismissal or duplicate popup request - ignore gracefully without error logs
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      ) {
        return false;
      }

      if (code === 'auth/popup-blocked') {
        console.warn('Sign-in popup was blocked by browser. Please allow popups or open in a new tab.');
        throw new Error('Sign-in popup was blocked by your browser. Please allow popups or open in a new tab.');
      }

      if (code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        console.warn(`[Firebase Auth] Domain "${domain}" is not in the Firebase Authorized Domains list.`);
        const err = new Error(
          `Domain "${domain}" is not authorized in Firebase Console. Please add "${domain}" to Authorized Domains in Firebase Authentication settings.`
        );
        (err as any).code = 'auth/unauthorized-domain';
        (err as any).domain = domain;
        throw err;
      }

      console.error('Sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
