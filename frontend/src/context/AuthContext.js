import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';
import { getPendingJoinCode } from '../utils/deepLinkStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingJoinCode, setPendingJoinCode] = useState(null);

  /**
   * Check for pending join code after successful authentication
   * Returns the join code if one is found (S-402: auto-join flow)
   */
  const checkPendingJoinCode = async () => {
    try {
      const joinCode = await getPendingJoinCode();
      if (joinCode) {
        console.log('✅ Found pending join code after auth:', joinCode);
        setPendingJoinCode(joinCode);
        return joinCode;
      }
      return null;
    } catch (error) {
      console.error('Error checking pending join code:', error);
      return null;
    }
  };

  /**
   * Safely fetch user profile from Firestore with offline fallback
   * Returns profile data or null if offline/unavailable
   */
  const fetchUserProfile = async (uid, user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      // Check if error is due to offline/unavailable Firestore
      const isOfflineError =
        error.code === 'unavailable' ||
        error.code === 'failed-precondition' ||
        error.message?.includes('client is offline');

      if (isOfflineError) {
        console.warn('Firestore offline - using fallback profile data:', error.message);

        // Return fallback profile data derived from Firebase Auth user
        const fallbackProfile = {
          display_name: user?.displayName || user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
          phone: null,
          // Mark as fallback so we can refresh later if needed
          _isFallback: true,
        };

        return fallbackProfile;
      }

      // For other errors, log and return null
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Auto-rehydrate session on app launch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get fresh token
          const token = await user.getIdToken();
          await SecureStore.setItemAsync('userToken', token);

          // Fetch user profile from Firestore (with offline fallback)
          const profile = await fetchUserProfile(user.uid, user);
          if (profile) {
            setUserProfile(profile);
          }

          setCurrentUser(user);
        } catch (error) {
          // Only fail if token/auth errors occur (not profile fetch)
          if (error.code?.startsWith('auth/')) {
            console.error('Auth error loading user session:', error);
            setCurrentUser(null);
            setUserProfile(null);
          } else {
            // Non-auth errors (e.g., SecureStore): still set user as authenticated
            console.warn('Non-critical error during session load:', error);
            setCurrentUser(user);
          }
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register new user
  const register = async (displayName, email, password, phone = null) => {
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Store additional profile data in Firestore
      const profileData = {
        display_name: displayName,
        email: email,
        phone: phone || null,
        created_at: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', user.uid), profileData);
      } catch (firestoreError) {
        // Firestore write failed (possibly offline), but registration succeeded
        console.warn('Profile write to Firestore failed (user may be offline):', firestoreError.message);
        // Continue - we'll use profileData locally
      }

      // 3. Store token in SecureStore
      const token = await user.getIdToken();
      await SecureStore.setItemAsync('userToken', token);

      // 4. Update local state
      setUserProfile(profileData);
      setCurrentUser(user);

      // 5. Check for pending join code (S-203: deep link flow)
      await checkPendingJoinCode();

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);

      // Handle Firebase-specific errors
      let errorMessage = 'Registration failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      return { success: false, error: errorMessage };
    }
  };

  // Login existing user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store token
      const token = await user.getIdToken();
      await SecureStore.setItemAsync('userToken', token);

      // Fetch user profile (with offline fallback)
      const profile = await fetchUserProfile(user.uid, user);
      if (profile) {
        setUserProfile(profile);
      }

      setCurrentUser(user);

      // Check for pending join code (S-203: deep link flow)
      await checkPendingJoinCode();

      return { success: true, user };
    } catch (error) {
      // Only treat auth errors as login failures
      if (error.code?.startsWith('auth/')) {
        console.error('Login error:', error);

        let errorMessage = 'Login failed. Please try again.';

        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection and try again.';
        }

        return { success: false, error: errorMessage };
      }

      // Non-auth errors (e.g., SecureStore issues) - log but don't fail login
      console.warn('Non-critical error during login:', error);
      return { success: true, user: auth.currentUser };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      await SecureStore.deleteItemAsync('userToken');
      setCurrentUser(null);
      setUserProfile(null);
      setPendingJoinCode(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout. Please try again.' };
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    pendingJoinCode,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
