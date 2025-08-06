import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';

interface Barber {
  id: number;
  name: string;
  commission?: number;
  user: { id: number; name: string; email: string };
}

const BarberBarbers: React.FC = () => {
  const { token } = useAuth();
  const { unit } = useUnit();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [form, setForm] = useState<Partial<Barber & { userId: number }>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [users, setUsers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [msg, setMsg] = useState('');
  const [agenda, setAgenda] = useState<{ [barberId: number]: any[] }>({});
  const [showAgendaId, setShowAgendaId] = useState<number | null>(null);
  const [agendaFilters, setAgendaFilters] = useState<{ date: string; status: string }>({ date: '', status: '' });

  const fetchBarbers = async () => {
    if (!unit) return;
    const res = await fetch(`/api/barbers?unitId=${unit.id}`, { headers: { Authorization: `Bearer ${token}` } });
    setBarbers(await res.json());
  };
  const fetchUsers = async () => {
    const res = await fetch('/api/auth?role=barber', { headers: { Authorization: `Bearer ${token}` } });
    setUsers(await res.json());
  };
  useEffect(() => { fetchBarbers(); fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/barbers/${editingId}` : '/api/barbers';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, unitId: unit.id }),
    });
    if (res.ok) {
      setMsg(editingId ? 'Barbeiro atualizado!' : 'Barbeiro adicionado!');
      setForm({});
      setEditingId(null);
      fetchBarbers();
    } else {
      setMsg('Erro ao salvar barbeiro.');
    }
  };
  const handleEdit = (b: Barber) => {
    setForm({ name: b.name, commission: b.commission, userId: b.user.id });
    setEditingId(b.id);
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Remover barbeiro?')) return;
    const res = await fetch(`/api/barbers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setMsg('Barbeiro removido!');
      fetchBarbers();
    } else {
      setMsg('Erro ao remover barbeiro.');
    }
  };

  const handleShowAgenda = async (barberId: number) => {
    if (agenda[barberId]) {
      setShowAgendaId(showAgendaId === barberId ? null : barberId);
      return;
    }
    const res = await fetch(`/api/appointments?barberId=${barberId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAgenda(a => ({ ...a, [barberId]: data }));
    setShowAgendaId(barberId);
    setAgendaFilters({ date: '', status: '' });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Barbeiros</h2>
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2 items-end">
        <input required placeholder="Nome" className="border p-1" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input type="number" min={0} max={100} step={0.01} placeholder="Comissão (%)" className="border p-1" value={form.commission || ''} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} />
        <select required value={form.userId || ''} onChange={e => setForm(f => ({ ...f, userId: Number(e.target.value) }))} className="border p-1">
          <option value="">Selecione o usuário</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
        <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded">{editingId ? 'Salvar' : 'Adicionar'}</button>
        {editingId && <button type="button" className="ml-2" onClick={() => { setForm({}); setEditingId(null); }}>Cancelar</button>}
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Nome</th>
            <th className="border p-1">Comissão (%)</th>
            <th className="border p-1">Usuário</th>
            <th className="border p-1">Ações</th>
          </tr>
        </thead>
        <tbody>
          {barbers.map(b => (
            <tr key={b.id}>
              <td className="border p-1">{b.name}</td>
              <td className="border p-1">{b.commission ?? '-'}</td>
              <td className="border p-1">{b.user?.name} ({b.user?.email})</td>
              <td className="border p-1 flex gap-2">
                <button onClick={() => handleEdit(b)} className="text-blue-600">Editar</button>
                <button onClick={() => handleDelete(b.id)} className="text-red-600">Remover</button>
                <button onClick={() => handleShowAgenda(b.id)} className="text-green-600">{showAgendaId === b.id ? 'Fechar agenda' : 'Ver agenda'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAgendaId && agenda[showAgendaId] && (
        <div className="mt-6 bg-white p-6 rounded shadow border max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Agenda de {barbers.find(b => b.id === showAgendaId)?.name}</h3>
            <button onClick={() => setShowAgendaId(null)} className="text-red-600 font-semibold">Fechar</button>
          </div>
          <form className="flex flex-wrap gap-2 mb-4 items-end">
            <label className="flex flex-col">
              <span className="text-xs">Data</span>
              <input type="date" value={agendaFilters.date} onChange={e => setAgendaFilters(f => ({ ...f, date: e.target.value }))} className="border p-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-xs">Status</span>
              <select value={agendaFilters.status} onChange={e => setAgendaFilters(f => ({ ...f, status: e.target.value }))} className="border p-1">
                <option value="">Todos</option>
                <option value="scheduled">Agendado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
                <option value="no_show">Faltou</option>
              </select>
            </label>
            <button type="button" className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => setAgendaFilters({ date: '', status: '' })}>Limpar</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full border rounded-lg text-sm">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="border p-2">Data</th>
                  <th className="border p-2">Horário</th>
                  <th className="border p-2">Cliente</th>
                  <th className="border p-2">Serviços</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {agenda[showAgendaId]
                  .filter((a: any) => (!agendaFilters.date || a.date === agendaFilters.date) && (!agendaFilters.status || a.status === agendaFilters.status))
                  .map((a: any, i: number) => (
                    <tr key={a.id} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border p-2 whitespace-nowrap">{a.date}</td>
                      <td className="border p-2 whitespace-nowrap">{a.startTime} - {a.endTime}</td>
                      <td className="border p-2 whitespace-nowrap">{a.user?.name}</td>
                      <td className="border p-2">{a.services?.map((s: any) => s.name).join(', ')}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold 
                          ${a.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : ''}
                          ${a.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                          ${a.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                          ${a.status === 'no_show' ? 'bg-yellow-100 text-yellow-700' : ''}
                        `}>
                          {a.status === 'scheduled' && 'Agendado'}
                          {a.status === 'completed' && 'Concluído'}
                          {a.status === 'cancelled' && 'Cancelado'}
                          {a.status === 'no_show' && 'Faltou'}
                          {!['scheduled','completed','cancelled','no_show'].includes(a.status) && a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {agenda[showAgendaId].filter((a: any) => (!agendaFilters.date || a.date === agendaFilters.date) && (!agendaFilters.status || a.status === agendaFilters.status)).length === 0 && <div className="text-gray-500 mt-2">Nenhum agendamento encontrado.</div>}
        </div>
      )}
    </div>
  );
};

export default BarberBarbers; 