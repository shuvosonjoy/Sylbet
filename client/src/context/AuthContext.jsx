import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sylbets_token');
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token) => {
    try {
      const userData = await api.getProfile(token);
      setUser({ ...userData, token });
    } catch (error) {
      localStorage.removeItem('sylbets_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('sylbets_token', data.token);
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password });
    localStorage.setItem('sylbets_token', data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sylbets_token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;
  const token = user?.token || localStorage.getItem('sylbets_token');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAdmin,
      isAuthenticated,
      token
    }}>
      {children}
    </AuthContext.Provider>
  );
};
