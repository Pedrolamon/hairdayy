import { type AuthContextType } from '../context/AuthContext';

// Esta função cria uma chamada de API centralizada que
// automaticamente adiciona o token e lida com erros de autenticação (401).
// Usar uma abordagem assim evita a repetição de código em cada componente.
export const createAuthenticatedApi = (authContext: AuthContextType) => {
  const { token, logout } = authContext;

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    // 1. Adiciona o token ao cabeçalho da requisição
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      // 2. Verifica se o token é inválido/expirado
      if (response.status === 401) {
        console.error('API Error: 401 Unauthorized. Token inválido ou expirado.');
        logout(); // Chama a função de logout do AuthContext
        window.location.href = '/login'; // Redireciona o usuário
        return null;
      }
      
      return response;
    } catch (error) {
      console.error('Network or fetch error:', error);
      // Se houver um erro de rede, o usuário pode estar offline.
      // Você pode optar por manter a sessão, mas é importante avisar o usuário.
      throw error;
    }
  };

  return authenticatedFetch;
};