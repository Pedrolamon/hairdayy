import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface Report {
  totalReceitas: number;
  totalDespesas: number;
  balanco: number;
  porCategoria: Record<string, { income: number; expense: number }>;
  registros: Array<{
    id: number;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: string;
    category: string;
  }>;
}

const BarberFinancial: React.FC = () => {
  const { token } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Formulário manual
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: '',
    category: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  useEffect(() => {
    if (editing && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [editing]);

  const fetchReport = () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    fetch(`/api/financial/report?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao buscar relatório financeiro.');
        setLoading(false);
      });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (r: any) => {
    setForm({
      type: r.type,
      amount: String(r.amount),
      description: r.description,
      date: r.date,
      category: r.category,
    });
    setEditing(r.id);
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Remover este registro?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/financial/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchReport();
    } catch {
      setError('Erro ao remover registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    if (!form.date) {
      setFormError('Data é obrigatória.');
      setFormLoading(false);
      return;
    }
    if (Number(form.amount) <= 0) {
      setFormError('Valor deve ser maior que zero.');
      setFormLoading(false);
      return;
    }
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/financial/${editing}` : '/api/financial';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      if (!res.ok) throw new Error();
      setForm({ type: 'income', amount: '', description: '', date: '', category: '' });
      setEditing(null);
      setFormSuccess(editing ? 'Registro atualizado com sucesso!' : 'Registro lançado com sucesso!');
      fetchReport();
    } catch {
      setFormError('Erro ao lançar registro.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Relatório Financeiro</h3>
      {editing && (
        <button type="button" className="text-sm text-gray-500 hover:underline" onClick={() => { setEditing(null); setForm({ type: 'income', amount: '', description: '', date: '', category: '' }); setFormError(''); setFormSuccess(''); }}>Cancelar edição</button>
      )}
      <form onSubmit={handleFormSubmit} className="bg-gray-50 rounded p-4 mb-6 flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
        <select
          name="type"
          className="border rounded px-2 py-1"
          value={form.type}
          onChange={handleFormChange}
        >
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
        <input
          ref={amountInputRef}
          name="amount"
          type="number"
          step="0.01"
          min="0"
          className="border rounded px-2 py-1"
          placeholder="Valor"
          value={form.amount}
          onChange={handleFormChange}
          required
        />
        <input
          name="category"
          className="border rounded px-2 py-1"
          placeholder="Categoria"
          value={form.category}
          onChange={handleFormChange}
          required
        />
        <input
          name="date"
          type="date"
          className="border rounded px-2 py-1"
          value={form.date}
          onChange={handleFormChange}
          required
        />
        <input
          name="description"
          className="border rounded px-2 py-1 flex-1"
          placeholder="Descrição"
          value={form.description}
          onChange={handleFormChange}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={formLoading}
        >
          {formLoading ? 'Salvando...' : 'Lançar'}
        </button>
        {formError && <div className="text-red-500 text-sm">{formError}</div>}
        {formSuccess && <div className="text-green-600 text-sm">{formSuccess}</div>}
      </form>
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <span className="self-center">até</span>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        {(startDate || endDate) && (
          <button
            className="ml-2 text-sm text-gray-500 hover:underline"
            onClick={() => { setStartDate(''); setEndDate(''); }}
          >
            Limpar filtro
          </button>
        )}
      </div>
      {loading && <div className="text-gray-500">Carregando relatório...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {report && (
        <>
          <div className="mb-4 flex flex-wrap gap-6">
            <div className="bg-green-100 rounded p-3">
              <div className="text-green-700 font-bold">Receitas</div>
              <div className="text-2xl font-bold">R$ {report.totalReceitas.toFixed(2)}</div>
            </div>
            <div className="bg-red-100 rounded p-3">
              <div className="text-red-700 font-bold">Despesas</div>
              <div className="text-2xl font-bold">R$ {report.totalDespesas.toFixed(2)}</div>
            </div>
            <div className="bg-blue-100 rounded p-3">
              <div className="text-blue-700 font-bold">Balanço</div>
              <div className="text-2xl font-bold">R$ {report.balanco.toFixed(2)}</div>
            </div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-2">Por categoria:</div>
            <ul className="space-y-1">
              {Object.entries(report.porCategoria).map(([cat, val]) => (
                <li key={cat} className="flex gap-4">
                  <span className="font-bold">{cat}:</span>
                  <span className="text-green-700">Receita: R$ {val.income.toFixed(2)}</span>
                  <span className="text-red-700">Despesa: R$ {val.expense.toFixed(2)}</span>
                </li>
              ))}
              {Object.keys(report.porCategoria).length === 0 && <li className="text-gray-500">Nenhuma categoria encontrada.</li>}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Registros:</div>
            <ul className="divide-y">
              {report.registros.map(r => (
                <li key={r.id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <span className={r.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                      {r.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                    <span className="ml-2 font-semibold">R$ {r.amount.toFixed(2)}</span>
                    <span className="ml-2 text-gray-500 text-sm">{r.date && new Date(r.date).toLocaleDateString()}</span>
                    <span className="ml-2 text-gray-500 text-sm">{r.category}</span>
                  </div>
                  <div className="text-sm text-gray-700 flex gap-2 items-center">{r.description}
                    <button className="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1" onClick={() => handleEdit(r)} disabled={formLoading}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6l9-9a2.828 2.828 0 10-4-4l-9 9z" /></svg>
                      Editar
                    </button>
                    <button className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1" onClick={() => handleDelete(r.id)} disabled={formLoading}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Remover
                    </button>
                  </div>
                </li>
              ))}
              {report.registros.length === 0 && <li className="text-gray-500">Nenhum registro encontrado.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default BarberFinancial; 