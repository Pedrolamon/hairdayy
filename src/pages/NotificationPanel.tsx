import { useState } from 'react';

interface Notification {
  id: number;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export default function NotificationPanel () {

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [itemLoading, setItemLoading] = useState<{ [id: number]: 'read' | 'delete' | null }>({});
  const [removing, setRemoving] = useState<{ [id: number]: boolean }>({});

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await fetch('/notifications/history', );
    setNotifications(await res.json());
    setLoading(false);
  };

  const markAsRead = async (id: number) => {
    setItemLoading(l => ({ ...l, [id]: 'read' }));
    await fetch(`/notifications/history/${id}/read`, { method: 'PUT', } );
    setMsg('Notificação marcada como lida!');
    await fetchNotifications();
    setItemLoading(l => ({ ...l, [id]: null }));
  };

  const deleteNotification = async (id: number) => {
    setItemLoading(l => ({ ...l, [id]: 'delete' }));
    setRemoving(r => ({ ...r, [id]: true }));
    setTimeout(async () => {
      await fetch(`/notifications/history/${id}`, { method: 'DELETE',});
      setMsg('Notificação excluída!');
      await fetchNotifications();
      setItemLoading(l => ({ ...l, [id]: null }));
      setRemoving(r => ({ ...r, [id]: false }));
    }, 400);
  };

  const markAllAsRead = async () => {
    setActionLoading(true);
    await fetch('/notifications/history/mark-all-read', { method: 'PUT', });
    setMsg('Todas as notificações marcadas como lidas!');
    await fetchNotifications();
    setActionLoading(false);
  };
  const deleteAll = async () => {
    if (!window.confirm('Tem certeza que deseja excluir todas as notificações?')) return;
    setActionLoading(true);
    await fetch('/notifications/history/delete-all', { method: 'DELETE', });
    setMsg('Todas as notificações excluídas!');
    await fetchNotifications();
    setActionLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Notificações</h2>
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="border p-1" />
        <select value={filter} onChange={e => setFilter(e.target.value as any)} className="border p-1">
          <option value="all">Todas</option>
          <option value="unread">Não lidas</option>
          <option value="read">Lidas</option>
        </select>
        <button type="button" className="bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={markAllAsRead} disabled={actionLoading}>{actionLoading ? 'Aguarde...' : 'Marcar todas como lidas'}</button>
        <button type="button" className="bg-red-600 text-white px-2 py-1 rounded text-xs" onClick={deleteAll} disabled={actionLoading}>{actionLoading ? 'Aguarde...' : 'Excluir todas'}</button>
      </div>
      {loading ? <div>Carregando...</div> : notifications.length === 0 ? <div className="text-gray-500">Nenhuma notificação.</div> : (
        <ul className="divide-y">
          {notifications
            .filter(n => (filter === 'all' || (filter === 'unread' ? !n.read : n.read)))
            .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))
            .slice((page-1)*pageSize, page*pageSize)
            .map(n => (
              <li key={n.id} className={`py-3 px-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${!n.read ? 'bg-blue-50' : ''} transition-all duration-400 ${removing[n.id] ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <div>
                  <div className="font-semibold text-base flex items-center gap-2">
                    {n.title}
                    {!n.read && <span className="inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Nova</span>}
                  </div>
                  <div className="text-sm text-gray-700">{n.body}</div>
                  <div className="text-xs text-gray-400">{new Date(n.date).toLocaleString()}</div>
                </div>
                <div className="flex gap-2 items-center">
                  {!n.read && <button onClick={() => markAsRead(n.id)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs" disabled={itemLoading[n.id] === 'read'}>{itemLoading[n.id] === 'read' ? 'Aguarde...' : 'Marcar como lida'}</button>}
                  <button onClick={() => deleteNotification(n.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs" disabled={itemLoading[n.id] === 'delete'}>{itemLoading[n.id] === 'delete' ? 'Aguarde...' : 'Excluir'}</button>
                </div>
              </li>
            ))}
        </ul>
      )}
      {notifications.filter(n => (filter === 'all' || (filter === 'unread' ? !n.read : n.read))).filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())).length > pageSize && (
        <div className="flex gap-2 justify-center mt-4">
          <button className="px-2 py-1 border rounded" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</button>
          <span className="px-2">Página {page}</span>
          <button className="px-2 py-1 border rounded" disabled={page*pageSize >= notifications.filter(n => (filter === 'all' || (filter === 'unread' ? !n.read : n.read))).filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())).length} onClick={() => setPage(p => p+1)}>Próxima</button>
        </div>
      )}
    </div>
  );
};
