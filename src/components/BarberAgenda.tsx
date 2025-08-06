import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';

interface Appointment {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  user: { name: string };
  services: { name: string }[];
}

const BarberAgenda: React.FC = () => {
  const { user, token } = useAuth();
  const { unit } = useUnit();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', clientName: '', service: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, [user, token, unit]);

  useEffect(() => {
    if (showForm && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [showForm]);

  const fetchAppointments = () => {
    if (!user || !unit) return;
    setLoading(true);
    setError('');
    fetch(`/api/appointments?barberId=${user.id}&unitId=${unit.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao buscar agendamentos.');
        setLoading(false);
      });
  };

  const handleStatus = async (id: number, status: string) => {
    setActionLoading(id);
    setError('');
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      fetchAppointments();
    } catch {
      setError('Erro ao atualizar agendamento.');
    } finally {
      setActionLoading(null);
    }
  };

  // Função para criar agendamento manual
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    if (form.endTime <= form.startTime) {
      setFormError('Horário final deve ser maior que o inicial.');
      setFormLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          clientName: form.clientName,
          service: form.service,
          barberId: user?.id,
          unitId: unit?.id,
        }),
      });
      if (!res.ok) throw new Error();
      setShowForm(false);
      setForm({ date: '', startTime: '', endTime: '', clientName: '', service: '' });
      setFormSuccess('Agendamento criado com sucesso!');
      fetchAppointments();
    } catch {
      setFormError('Erro ao criar agendamento.');
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = filterDate
    ? appointments.filter(app => app.date === filterDate)
    : appointments;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-2">
        <h3 className="text-lg font-bold">Agenda</h3>
        <input
          type="date"
          className="border rounded px-2 py-1 mt-2 md:mt-0"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        {filterDate && (
          <button
            className="ml-2 text-sm text-gray-500 hover:underline"
            onClick={() => setFilterDate('')}
          >
            Limpar filtro
          </button>
        )}
      </div>
      {loading && <div className="text-gray-500">Carregando agendamentos...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="mb-4 flex gap-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Fechar' : 'Novo agendamento'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleFormSubmit} className="bg-gray-50 rounded p-4 mb-4 flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
          <input ref={dateInputRef} name="date" type="date" className="border rounded px-2 py-1" value={form.date} onChange={handleFormChange} required />
          <input name="startTime" type="time" className="border rounded px-2 py-1" value={form.startTime} onChange={handleFormChange} required />
          <input name="endTime" type="time" className="border rounded px-2 py-1" value={form.endTime} onChange={handleFormChange} required />
          <input name="clientName" className="border rounded px-2 py-1" placeholder="Cliente" value={form.clientName} onChange={handleFormChange} required />
          <input name="service" className="border rounded px-2 py-1" placeholder="Serviço" value={form.service} onChange={handleFormChange} required />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={formLoading}>{formLoading ? 'Salvando...' : 'Criar'}</button>
          {formError && <div className="text-red-500 text-sm">{formError}</div>}
          {formSuccess && <div className="text-green-600 text-sm">{formSuccess}</div>}
        </form>
      )}
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Data</th>
            <th className="border p-1">Horário</th>
            <th className="border p-1">Cliente</th>
            <th className="border p-1">Serviços</th>
            <th className="border p-1">Status</th>
            <th className="border p-1">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(app => (
            <tr key={app.id}>
              <td className="border p-1">{new Date(app.date).toLocaleDateString()}</td>
              <td className="border p-1">{app.startTime} - {app.endTime}</td>
              <td className="border p-1">{app.user?.name}</td>
              <td className="border p-1">{app.services.map(s => s.name).join(', ')}</td>
              <td className="border p-1">{app.status}</td>
              <td className="border p-1">
                {app.status === 'scheduled' && (
                  <>
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={() => handleStatus(app.id, 'completed')} disabled={actionLoading === app.id}>{actionLoading === app.id ? 'Salvando...' : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Concluído</>)}</button>
                    <button className="bg-yellow-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={() => handleStatus(app.id, 'attended')} disabled={actionLoading === app.id}>{actionLoading === app.id ? 'Salvando...' : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="yellow" /></svg>Compareceu</>)}</button>
                    <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={() => handleStatus(app.id, 'no_show')} disabled={actionLoading === app.id}>{actionLoading === app.id ? 'Salvando...' : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Faltou</>)}</button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={() => handleStatus(app.id, 'cancelled')} disabled={actionLoading === app.id}>{actionLoading === app.id ? 'Salvando...' : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancelar</>)}</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && !loading && <li className="text-gray-500">Nenhum agendamento encontrado.</li>}
    </div>
  );
};

export default BarberAgenda; 