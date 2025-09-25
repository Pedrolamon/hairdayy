import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { Ban, Save } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  isBlocked?: boolean;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  services: { name: string }[];
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
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
      const { data } = await api.get<Client[]>('/Clients');
      setClients(data);
    } catch {
      setError('Error searching for clients.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (client: Client) => {
    setSelected(client);
    setNotes(client.notes || '');
    setLoading(true);
    try {
      const { data } = await api.get(`/Clients/${client.id}`);
      setAppointments(data.appointments || []);
    } catch {
      setError('Error fetching history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setNotesLoading(true);
    setNotesSuccess('');
    try {
      await api.put(`/Clients/${selected?.id}/notes`, { notes });
      setNotesSuccess('Notes saved!');
      fetchClients();
    } catch {
      setError('Error saving notes.');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleBlockClient = async () => {
    if (!selected) return;

    setIsBlocking(true);
    try {
      await api.put(`/Clients/${selected.id}/block`);
      setSelected({ ...selected, isBlocked: !selected.isBlocked });
      fetchClients();
    } catch {
      setError(`Erro ao ${selected.isBlocked ? 'unlock' : 'block'} the client.`);
    } finally {
      setIsBlocking(false);
    }
  };

  const totalClients = clients.length;
  const blockedClients = clients.filter(c => c.isBlocked).length;

  return (
    <div className="p-6 bg-gray-100 min-h-screen dark:bg-gray-900">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Customer Management
      </h3>

      <div className="flex gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex-1">
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Total Customers
          </div>
          <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex-1">
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Blocked Customers
          </div>
          <div className="text-2xl font-bold text-red-600">{blockedClients}</div>
        </div>
      </div>

      {loading && <div className="text-gray-500 dark:text-gray-400">Loading...</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      
      {!selected ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {clients.map(client => (
              <li key={client.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-100">
                    {client.name}
                    {client.isBlocked && (
                      <span className="ml-2 text-red-500 font-normal text-sm">
                        (Blocked)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {client.email} {client.phone && `| ${client.phone}`}
                  </div>
                </div>
                <button
                  className="mt-2 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                  onClick={() => fetchDetails(client)}
                >
                  See details
                </button>
              </li>
            ))}
            {clients.length === 0 && !loading && <li className="p-4 text-center text-gray-500 dark:text-gray-400">No customers found.</li>}
          </ul>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <button
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center gap-1"
              onClick={() => setSelected(null)}
            >
              &larr; To go back
            </button>
            <button
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition ${
                selected.isBlocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              onClick={handleBlockClient}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {selected.isBlocked ? 'Unlocking...' : 'Blocking...'}
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  {selected.isBlocked ? 'Unlock Client' : 'Block Client'}
                </>
              )}
            </button>
          </div>
          
          <div className="mb-4">
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {selected.name}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {selected.email} {selected.phone && `| ${selected.phone}`}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer Notes</h4>
            <div className="relative">
              <textarea
                ref={notesInputRef}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
              />
              <button
                className="absolute bottom-3 right-3 bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition"
                onClick={handleSaveNotes}
                disabled={notesLoading}
              >
                {notesLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {notesLoading ? 'Saving...' : 'Save'}
              </button>
              {notesSuccess && <div className="text-green-600 text-sm mt-1">{notesSuccess}</div>}
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Appointment History</h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                {appointments.length > 0 ? (
                  appointments.map(app => (
                    <li key={app.id} className="py-2">
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {new Date(app.date).toLocaleDateString()} às {app.startTime}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Services: {app.services.map(s => s.name).join(', ')}
                      </div>
                      <div className={`text-sm font-medium ${app.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        Status: {app.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center py-4 text-gray-500 dark:text-gray-400">No appointments found.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};