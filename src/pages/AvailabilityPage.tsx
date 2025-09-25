import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';

interface Block {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export default function Availability () {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', reason: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (form.date && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [form.date]);

  const fetchBlocks = async () => {
    setLoading(true);
    setError('');

    try {
       const { data } = await api.get<Block[]>('/availability',);
      setBlocks(data);
    } catch (error) {
      setError('Erro ao buscar bloqueios.');
    }finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    if (form.endTime <= form.startTime) {
      setFormError('End time must be greater than start time.');
      setFormLoading(false);
      return;
    }
    try {
      await api.post('/availability',form,);
      setForm({ date: '', startTime: '', endTime: '', reason: '' });
      setFormSuccess('Block registered successfully!');
      fetchBlocks();
    } catch {
      setFormError('Erro ao criar bloqueio.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this block?')) return;
    setLoading(true);
    try {
      await api.delete(`/availability/${id}`,);
      fetchBlocks();
    } catch {
      setError('Error removing lock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Availability Blocks</h3>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Campo de Data */}
            <div className="flex flex-col">
              <label htmlFor="date" className="text-sm font-medium text-gray-700 mb-1">Data</label>
              <input ref={dateInputRef} name="date" type="date" id="date" className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" value={form.date} onChange={handleFormChange} required />
            </div>

            {/* Campo Hora de Início */}
            <div className="flex flex-col">
              <label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-1">Início</label>
              <input name="startTime" type="time" id="startTime" className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" value={form.startTime} onChange={handleFormChange} required />
            </div>

            {/* Campo Hora de Fim */}
            <div className="flex flex-col">
              <label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-1">End</label>
              <input name="endTime" type="time" id="endTime" className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" value={form.endTime} onChange={handleFormChange} required />
            </div>

            {/* Campo Motivo */}
            <div className="flex flex-col">
              <label htmlFor="reason" className="text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input name="reason" id="reason" className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Consulta médica" value={form.reason} onChange={handleFormChange} />
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {formError && <div className="text-red-500 text-sm font-medium">{formError}</div>}
              {formSuccess && <div className="text-green-600 text-sm font-medium">{formSuccess}</div>}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200" disabled={formLoading}>
                {formLoading ? 'Salvando...' : 'Adicionar Bloqueio'}
              </button>
              <button type="button" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200" onClick={() => { setForm({ date: '', startTime: '', endTime: '', reason: '' }); setFormError(''); setFormSuccess(''); }}>
                To clean
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h4 className="text-xl font-bold text-gray-800 mb-4">Active Blocks</h4>
        {loading && <div className="text-gray-500">Loading locks...</div>}
        {error && <div className="text-red-500">{error}</div>}

        <ul className="space-y-4">
          {blocks.length === 0 && !loading && (
            <li className="text-gray-500 p-4 rounded-md border border-gray-200 text-center">No block registered.</li>
          )}
          
          {blocks.map(block => (
            <li key={block.id} className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-lg">
                  {formatDate(block.date)}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {block.startTime} - {block.endTime}
                  {block.reason && <span className="ml-2 text-gray-500 italic">({block.reason})</span>}
                </p>
              </div>
              <button className="bg-red-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2" onClick={() => handleDelete(block.id)} disabled={loading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

