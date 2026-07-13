import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      if (!pb.authStore.token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      try {
        await pb.ready;
        if (cancelled) return;
        if (pb.authStore.isValid) {
          setCurrentUser(pb.authStore.model);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (cancelled) return;
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initAuth();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (token && model) {
        setCurrentUser(model);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setCurrentUser(authData.record);
      setIsAuthenticated(true);
      return authData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await pb.authStore.clear();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;