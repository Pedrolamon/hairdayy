import React, { useState } from 'react';

interface Props {
  onLogin: (token: string, user: any) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Credenciais inválidas');
      const data = await res.json();
      onLogin(data.token, data.user);
    } catch (err) {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-sm mx-auto bg-white rounded shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Login do Barbeiro/Admin</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="border rounded px-3 py-2 w-full"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2 w-full"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
    </div>
  );
};

export default Login; 