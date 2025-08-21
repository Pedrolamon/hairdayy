import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  services: { name: string }[];
}

export default function Clients () {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState('');
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selected && notesInputRef.current) {
      notesInputRef.current.focus();
    }
  }, [selected]);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
   try {
    const { data } = await api.get<Client[]>('/clients');
    setClients(data);
  } catch {
    setError('Erro ao buscar clientes.');
  } finally {
    setLoading(false);
  }
};

  const fetchDetails = async (client: Client) => {
    setSelected(client);
    setNotes(client.notes || '');
    setLoading(true);
    try {
    const { data } = await api.get(`/clients/${client.id}`);
    setAppointments(data.appointments || []);
  } catch {
    setError('Erro ao buscar histórico.');
  } finally {
    setLoading(false);
  }
};
  const handleSaveNotes = async () => {
    setNotesLoading(true);
    setNotesSuccess('');
    try {
      await api.put(`/clients/${selected?.id}/notes`, { notes });
      setNotesSuccess('Notas salvas!');
      fetchClients();
    } catch {
      setError('Erro ao salvar notas.');
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Clientes</h3>
      {loading && <div className="text-gray-500">Carregando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!selected ? (
        <ul className="divide-y">
          {clients.map(client => (
            <li key={client.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <span className="font-semibold">{client.name}</span>
                <span className="ml-2 text-gray-500">{client.email}</span>
                {client.phone && <span className="ml-2 text-gray-500">{client.phone}</span>}
              </div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm" onClick={() => fetchDetails(client)}>
                Ver detalhes
              </button>
            </li>
          ))}
          {clients.length === 0 && !loading && <li className="text-gray-500">Nenhum cliente encontrado.</li>}
        </ul>
      ) : (
        <div className="bg-gray-50 rounded p-4 mb-4">
          <button className="text-sm text-gray-500 hover:underline mb-2" onClick={() => setSelected(null)}>&larr; Voltar</button>
          <div className="mb-2 font-semibold">{selected.name} ({selected.email})</div>
          <div className="mb-2">Telefone: {selected.phone || '-'}</div>
          <div className="mb-2">Notas:</div>
          <textarea ref={notesInputRef} className="border rounded px-2 py-1 w-full mb-2" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={handleSaveNotes} disabled={notesLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {notesLoading ? 'Salvando...' : 'Salvar notas'}
          </button>
          {notesSuccess && <div className="text-green-600 text-sm mt-1">{notesSuccess}</div>}
          <div className="mt-4 font-semibold">Histórico de agendamentos:</div>
          <ul className="divide-y">
            {appointments.map(app => (
              <li key={app.id} className="py-2">
                <span className="font-semibold">{new Date(app.date).toLocaleDateString()} {app.startTime}</span>
                <span className="ml-2 text-gray-500">({app.status})</span>
                <span className="ml-2">{app.services.map(s => s.name).join(', ')}</span>
              </li>
            ))}
            {appointments.length === 0 && <li className="text-gray-500">Nenhum agendamento encontrado.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

