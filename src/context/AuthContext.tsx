import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';


interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = () => {
    console.log('LOGOUT: Removendo token e usuário do localStorage.');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const login = (newToken: string, newUser: User) => {
    console.log('LOGIN: Token e usuário recebidos, salvando no localStorage.');
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    console.log('LOGIN: Token e usuário salvos. Novo estado: token =', !!newToken, ', user =', !!newUser);
  };

  useEffect(() => {
    console.log('AUTH_CONTEXT: Executando useEffect para verificar o token...');
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user');

    if (storedToken && storedUserString) {
      console.log('AUTH_CONTEXT: Token e usuário encontrados no localStorage.');
      try {
        const storedUser = JSON.parse(storedUserString) as User;
        setToken(storedToken);
        setUser(storedUser);
        console.log('AUTH_CONTEXT: Usuário autenticado recuperado:', storedUser.name);
        console.log('Dados do usuário carregados do localStorage:', storedUser);
      } catch (e) {
        console.error('AUTH_CONTEXT: Erro ao fazer parse do usuário do localStorage.', e);
        logout();
      }
    } else {
      console.log('AUTH_CONTEXT: Nenhum token ou usuário encontrado no localStorage. Limpando o estado.');
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);