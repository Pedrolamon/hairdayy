import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Notification {
    id: number;
    title: string;
    body: string;
    date: string;
    read: boolean;
}

export default function NotificationPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [actionLoading, setActionLoading] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [removing, setRemoving] = useState<Set<number>>(new Set());

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications/history');
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const showMessage = (text: string, duration = 3000) => {
        setMsg(text);
        setTimeout(() => setMsg(''), duration);
    };

    const markAsRead = async (id: number) => {
        // Atualização Otimista
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        showMessage('Notificação marcada como lida!');

        try {
            await api.put(`/notifications/history/${id}/read`,);
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
            // Reverte a alteração
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: false } : n))
            );
            showMessage('Erro ao marcar como lida. Tente novamente.', 5000);
        }
    };

    const deleteNotification = async (id: number) => {
        setRemoving(prev => new Set(prev).add(id));
        showMessage('Notificação excluída!');

        try {
            await api.delete(`/notifications/history/${id}`);
            // Remove a notificação da lista após a animação de fade
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setRemoving(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }, 400);
        } catch (error) {
            console.error("Erro ao excluir:", error);
            setRemoving(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            showMessage('Erro ao excluir notificação. Tente novamente.', 5000);
        }
    };

    const markAllAsRead = async () => {
        setActionLoading(true);
        try {
            await api.put('/notifications/history/mark-all-read',);
            await fetchNotifications();
            showMessage('Todas as notificações marcadas como lidas!');
        } catch (error) {
            console.error("Erro ao marcar todas como lidas:", error);
            showMessage('Erro ao processar a ação. Tente novamente.', 5000);
        } finally {
            setActionLoading(false);
        }
    };

    const deleteAll = async () => {
        if (!window.confirm('Tem certeza que deseja excluir todas as notificações?')) return;
        setActionLoading(true);
        try {
            await api.delete('/notifications/history/delete-all',);
            await fetchNotifications();
            showMessage('Todas as notificações excluídas!');
        } catch (error) {
            console.error("Erro ao excluir todas:", error);
            showMessage('Erro ao processar a ação. Tente novamente.', 5000);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
        if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}h atrás`;

        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const filteredNotifications = notifications
        .filter(n => (filter === 'all' || (filter === 'unread' ? !n.read : n.read)))
        .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()));

    const totalPages = Math.ceil(filteredNotifications.length / pageSize);
    const paginatedNotifications = filteredNotifications.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl">
            {/* Cabeçalho e Título */}
            <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-extrabold text-gray-800">Notificações</h2>
                <p className="text-sm text-gray-500 mt-1">Gerencie seu histórico de alertas e novidades.</p>
            </div>

            {/* Mensagem de Feedback */}
            {msg && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transition-opacity duration-300 animate-fade-in z-50">
                    {msg}
                </div>
            )}

            {/* Controles: Busca, Filtro e Ações Globais */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <div className="flex gap-2 items-center">
                    <select
                        value={filter}
                        onChange={e => { setFilter(e.target.value as any); setPage(1); }}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        <option value="all">Todas</option>
                        <option value="unread">Não lidas</option>
                        <option value="read">Lidas</option>
                    </select>
                    <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {actionLoading ? 'Aguarde...' : 'Marcar todas como lidas'}
                    </button>
                    <button
                        type="button"
                        onClick={deleteAll}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {actionLoading ? 'Aguarde...' : 'Excluir todas'}
                    </button>
                </div>
            </div>

            {/* Lista de Notificações */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
                    <p className="mt-2">Carregando...</p>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border-t border-gray-200">
                    Nenhuma notificação encontrada.
                </div>
            ) : (
                <>
                    <ul className="divide-y divide-gray-200">
                        {paginatedNotifications.map(n => (
                            <li
                                key={n.id}
                                className={`py-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-400 transform ${removing.has(n.id) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${!n.read ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex-1">
                                    <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                        {n.title}
                                        {!n.read && (
                                            <span className="inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                Nova
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 text-base mt-1">{n.body}</p>
                                    <div className="text-xs text-gray-500 mt-2">{formatDate(n.date)}</div>
                                </div>
                                <div className="flex gap-2">
                                    {!n.read && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                        >
                                            Marcar como lida
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(n.id)}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6 text-gray-700">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Anterior
                            </button>
                            <span className="text-lg font-semibold">Página {page} de {totalPages}</span>
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages}
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}