import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/use-auth';
import { Send, Users, Target, MessageSquare } from 'lucide-react';

export default function NotificationBroadcast() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      showMessage('Título e mensagem são obrigatórios', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/notifications/broadcast', {
        title: title.trim(),
        body: body.trim(),
        targetRole: targetRole || undefined
      });

      showMessage(`Notificação enviada para ${response.data.recipients} usuários!`, 'success');
      setTitle('');
      setBody('');
      setTargetRole('');
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      showMessage(error.response?.data?.error || 'Erro ao enviar notificação', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Enviar Notificação em Massa
        </h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título da Notificação
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Ex: Atualização do Sistema"
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mensagem
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Digite a mensagem que será enviada para os usuários..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{body.length}/500 caracteres</p>
        </div>

        <div>
          <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Target className="h-4 w-4 inline mr-1" />
            Público-Alvo
          </label>
          <select
            id="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos os usuários</option>
            <option value="ADMIN">Administradores</option>
            <option value="BARBER">Barbeiros</option>
            <option value="CLIENT">Clientes</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4" />
          <span>
            {targetRole === 'ADMIN' && 'Será enviado para todos os administradores'}
            {targetRole === 'BARBER' && 'Será enviado para todos os barbeiros'}
            {targetRole === 'CLIENT' && 'Será enviado para todos os clientes'}
            {!targetRole && 'Será enviado para todos os usuários'}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !body.trim()}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Notificação
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
          💡 Dicas para Notificações Eficazes
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Use títulos claros e diretos</li>
          <li>• Seja conciso na mensagem</li>
          <li>• Use emojis para chamar atenção</li>
          <li>• Teste com um grupo pequeno primeiro</li>
          <li>• Evite spam - use com moderação</li>
        </ul>
      </div>
    </div>
  );
}
