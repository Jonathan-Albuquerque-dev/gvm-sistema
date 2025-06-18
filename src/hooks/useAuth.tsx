
"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import type { User } from 'firebase/auth'; // Using import type
import { onAuthStateChanged, signOut } from 'firebase/auth'; // signOut imported
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_TIMESTAMP_KEY = 'gvmLoginTimestamp'; // Specific key for this app
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in according to Firebase
        const storedTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);

        if (storedTimestamp) {
          const loginTime = parseInt(storedTimestamp, 10);
          // Check if timestamp is invalid or if session has expired
          if (Number.isNaN(loginTime) || (Date.now() - loginTime > SESSION_DURATION_MS)) {
            signOut(auth).then(() => {
              localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
              // onAuthStateChanged will be triggered again with null user.
              // setUser(null) and setLoading(false) will be handled in that subsequent call.
            }).catch(() => {
                // Even if signOut fails, clear timestamp and update app state for logout
                localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
                setUser(null); 
                setLoading(false);
            });
            return; // Exit early, let the next onAuthStateChanged call (after signOut) handle state
          }
          // Session is active and valid according to our timestamp
          setUser(currentUser);
          setLoading(false);
        } else {
          // No app-specific timestamp, but Firebase says user is logged in.
          // This means it's a fresh login or continuation of a Firebase session
          // where our app-specific timestamp wasn't set yet.
          localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
          setUser(currentUser);
          setLoading(false);
        }
      } else {
        // User is signed out according to Firebase
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array is correct as onAuthStateChanged handles its own lifecycle

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(redirectTo = "/login") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}
