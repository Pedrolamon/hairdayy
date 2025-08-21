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
    setUser(undefined);
    setIsAuth(false);
    setIsLoading(false);

    navigate("/login");
    localStorage.removeItem(AUTH_TOKEN_CONSTANT);
  };

  const login: AuthContextType["login"] = async (email, password) => {
    if (!email || !password) {
      throw new Error("E-mail and password are required.")
    }

    const { user, token } = await AuthLogin({ email, password })

    setUser(user)
    setIsAuth(true)

    localStorage.setItem(AUTH_TOKEN_CONSTANT, token)
    api.defaults.headers["Authorization"] = `Bearer ${token}`

    navigate("/dashboard") 
  };

  const checkSession = async () => {
    try {
      const user = await AuthMe()

      if(!user) {
        throw new Error("User not found")
      }

      setUser(user)
      setIsAuth(true)
    } catch {
      console.error("❌ checkSession falhou:")
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)

    // Check if token exists
    const token = localStorage.getItem(AUTH_TOKEN_CONSTANT)

    // If it doesn't exist, means the user is not auth, just ignore
    if(!token) {
      setIsLoading(false)

      return // Continue
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