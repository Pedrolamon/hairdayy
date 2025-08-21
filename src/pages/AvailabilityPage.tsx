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
      setFormError('Horário final deve ser maior que o inicial.');
      setFormLoading(false);
      return;
    }
    try {
      await api.post('/availability',form,);
      setForm({ date: '', startTime: '', endTime: '', reason: '' });
      setFormSuccess('Bloqueio cadastrado com sucesso!');
      fetchBlocks();
    } catch {
      setFormError('Erro ao criar bloqueio.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remover este bloqueio?')) return;
    setLoading(true);
    try {
      await api.delete(`/availability/${id}`,);
      fetchBlocks();
    } catch {
      setError('Erro ao remover bloqueio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Disponibilidade / Bloqueios</h3>
      <form onSubmit={handleFormSubmit} className="bg-gray-50 rounded p-4 mb-6 flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
        <input ref={dateInputRef} name="date" type="date" className="border rounded px-2 py-1" value={form.date} onChange={handleFormChange} required />
        <input name="startTime" type="time" className="border rounded px-2 py-1" value={form.startTime} onChange={handleFormChange} required />
        <input name="endTime" type="time" className="border rounded px-2 py-1" value={form.endTime} onChange={handleFormChange} required />
        <input name="reason" className="border rounded px-2 py-1" placeholder="Motivo (opcional)" value={form.reason} onChange={handleFormChange} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={formLoading}>{formLoading ? 'Salvando...' : 'Adicionar'}</button>
        {formError && <div className="text-red-500 text-sm">{formError}</div>}
        {formSuccess && <div className="text-green-600 text-sm">{formSuccess}</div>}
        <button type="button" className="text-sm text-gray-500 hover:underline" onClick={() => { setForm({ date: '', startTime: '', endTime: '', reason: '' }); setFormError(''); setFormSuccess(''); }}>Limpar</button>
      </form>
      {loading && <div className="text-gray-500">Carregando bloqueios...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="divide-y">
        {blocks.map(block => (
          <li key={block.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <span className="font-semibold">{block.date}</span>
              <span className="ml-2">{block.startTime} - {block.endTime}</span>
              {block.reason && <span className="ml-2 text-gray-500">({block.reason})</span>}
            </div>
            <button className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={() => handleDelete(block.id)} disabled={loading}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Remover
            </button>
          </li>
        ))}
        {blocks.length === 0 && !loading && <li className="text-gray-500">Nenhum bloqueio cadastrado.</li>}
      </ul>
    </div>
  );
};
