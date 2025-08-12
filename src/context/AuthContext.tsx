import React, { createContext, useState, useEffect } from 'react';
import type { User } from "../types/user"
import { AUTH_TOKEN_CONSTANT } from '../constants/auth-token-constants';
import { AuthLogin } from '../api/auth/auth-login';
import { useNavigate } from "react-router-dom"
import { api } from '../lib/api';
import { AuthMe } from '../api/auth/auth-me';

export interface AuthContextType {
  user?: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuth: boolean
  isLoading: boolean
}

const DEFAULT_VALUE: AuthContextType = {
  isAuth: false,
  isLoading: true,
  login: async () => { },
  logout: async () => { },
  user: undefined
} as const

export const AuthContext = createContext<AuthContextType>(DEFAULT_VALUE);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Values
  const [user, setUser] = useState<AuthContextType["user"]>(DEFAULT_VALUE.user);
  const [isAuth, setIsAuth] = useState<boolean>(DEFAULT_VALUE.isAuth);
  const [isLoading, setIsLoading] = useState<boolean>(DEFAULT_VALUE.isLoading);

  // Hooks
  const navigate = useNavigate()

  const logout = async () => {
    // Reset states
    setIsAuth(false);
    setIsLoading(false);

    // Remove token
    localStorage.removeItem(AUTH_TOKEN_CONSTANT);

    // Move user to login
    navigate("/login")
  };

  const login: AuthContextType["login"] = async (email, password) => {
    if (!email || !password) {
      throw new Error("E-mail and password are required.")
    }

    // Call api to login user
    const { user, token } = await AuthLogin({ email, password })

    // Set user and auth
    setUser(user)
    setIsAuth(true)

    // Save token in localstorage and store in the api client
    localStorage.setItem(AUTH_TOKEN_CONSTANT, token)
    api.defaults.headers["Authorization"] = `Bearer ${token}`

    // Send user to dashboard
    navigate("/auth-random-page") // TODO: update this to dashboard
  };

  const checkSession = async () => {
    try {
      const user = await AuthMe()

      if(!user) {
        throw new Error("User not found")
      }

      // Set user and auth
      setUser(user)
      setIsAuth(true)

      // Send user to dashboard
      navigate("/auth-random-page") // TODO: update this to dashboard
    } catch {
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)

    const token = localStorage.getItem(AUTH_TOKEN_CONSTANT)

    if(!token) {
      logout()
      return
    }

    api.defaults.headers["Authorization"] = `Bearer ${token}`
    
    checkSession()
  }, []);

  return (
    <AuthContext.Provider value={
      {
        isAuth,
        isLoading,
        login,
        logout,
        user
      }
    }>
      {children}
    </AuthContext.Provider>
  );
};