import React, { useEffect, useState, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Search,
} from 'lucide-react';
import { api } from '../lib/api';
import FinancialCalendar from './Fpage';

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


const LoadingSpinner = ({ size = '20', color = '#fff' }: { size?: string; color?: string }) => (
  <div
    style={{ width: size, height: size, borderTopColor: color }}
    className="animate-spin rounded-full border-2 border-solid border-white border-opacity-20"
  />
);

export default function Financial () {


  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: '',
    category: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [allCategories, setAllCategories] = useState(new Set<string>())
  
  const amountInputRef = useRef<HTMLInputElement>(null);


  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000); 
  };

  
  useEffect(() => {
    if (editingId && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [editingId]);

 
  useEffect(() => {
    fetchReport();
  }, [ startDate, endDate,categoryFilter]);
  

  useEffect(() => {
    if (report && report.registros) {
        const categories = new Set<string>();
        report.registros.forEach(r => {
            if (r.category) {
                categories.add(r.category);
            }
        });
        setAllCategories(categories);
    }
}, [report]);


  const fetchReport = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (categoryFilter) params.append('category', categoryFilter);

    const url = `/financial/report?${params.toString()}`;

    try {
      const res = await api.get(url,); 
      setReport(res.data);
    } catch (e: any) {
      showMessage(e.message, 'error');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (r: Report['registros'][0]) => {
    setForm({
      type: r.type,
      amount: String(r.amount),
      description: r.description,
      date: r.date,
      category: r.category,
    });
    setEditingId(r.id);
  };


  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    setLoading(true); 
    try {
      await api.delete(`/financial/${id}`,); 
      showMessage('Record removed successfully!', 'success');
      fetchReport();
    } catch (e: any) {
      showMessage(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (!form.date) {
      showMessage('Date is required.', 'error');
      setFormLoading(false);
      return;
    }
    if (Number(form.amount) <= 0) {
      showMessage('Value must be greater than zero.', 'error');
      setFormLoading(false);
      return;
    }
    try {
    const dataToSend = {
      ...form,
      amount: Number(form.amount),
    };
    
    if (editingId) {
      await api.put(`/financial/${editingId}`, dataToSend);
    } else {
      await api.post('/financial', dataToSend);
    }
      setForm({ type: 'income', amount: '', description: '', date: '', category: '' });
      setEditingId(null);
      showMessage(editingId ? 'Registration updated successfully!' : 'Registration launched successfully!', 'success');
      fetchReport();
    } catch (e: any) {
      showMessage(e.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased text-gray-800">
      <div className="max-w-7xl mx-auto">

        {message.text && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up ${
              message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Manage Finances
          </h2>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-6">
            <div className="flex flex-col">
              <label htmlFor="type" className="text-sm text-gray-600 mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={form.type}
                onChange={handleFormChange}
              >
                <option value="income">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="amount" className="text-sm text-gray-600 mb-1">
                Value
              </label>
              <input
                ref={amountInputRef}
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                value={form.amount}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="category" className="text-sm text-gray-600 mb-1">
                Category
              </label>
              <input
                id="category"
                name="category"
                type="text"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Salary, Material, Rent"
                value={form.category}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="date" className="text-sm text-gray-600 mb-1">
                Data
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={form.date}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="flex flex-col lg:col-span-3">
              <label htmlFor="description" className="text-sm text-gray-600 mb-1">
                Description (optional)
              </label>
              <input
                id="description"
                name="description"
                type="text"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed record description"
                value={form.description}
                onChange={handleFormChange}
              />
            </div>
            <div className="flex items-center gap-2 lg:col-span-1">
              {editingId && (
                <button
                  type="button"
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition flex-grow"
                  onClick={() => {
                    setForm({ type: 'income', amount: '', description: '', date: '', category: '' });
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex-grow flex items-center justify-center gap-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <LoadingSpinner color="#fff" />
                ) : (
                  <>
                    {editingId ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                    {editingId ? 'Salvar Edição' : 'Lançar'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="bg-gray-50 rounded-lg p-4 mb-8 flex flex-col md:flex-row items-center gap-4 border border-gray-200">
            <h4 className="font-semibold text-sm text-gray-600 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Filter by date:
            </h4>
            <div className="flex items-center gap-2">
             
            <label htmlFor="categoryFilter" className="sr-only">Filter by Category</label>
            <select
              id="categoryFilter"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {Array.from(allCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

              <label htmlFor="startDate" className="sr-only">Start Date</label>
              <input
                id="startDate"
                type="date"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-500 text-sm">until</span>
              <label htmlFor="endDate" className="sr-only">End Date</label>
              <input
                id="endDate"
                type="date"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            {(startDate || endDate || categoryFilter) && (
              <button
                className="text-sm text-gray-500 hover:text-blue-600 transition"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Report</h3>

          {loading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner size="50" color="#4F46E5" />
            </div>
          ) : report ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-100 rounded-lg p-5 shadow-sm flex items-center gap-4">
                  <TrendingUp className="w-10 h-10 text-green-600" />
                  <div>
                    <div className="text-green-700 font-semibold text-sm">Total Revenue</div>
                    <div className="text-3xl font-bold text-green-900">$ {report.totalReceitas.toFixed(2)}</div>
                  </div>
                </div>
                <div className="bg-red-100 rounded-lg p-5 shadow-sm flex items-center gap-4">
                  <TrendingDown className="w-10 h-10 text-red-600" />
                  <div>
                    <div className="text-red-700 font-semibold text-sm">Total Expenses</div>
                    <div className="text-3xl font-bold text-red-900">$ {report.totalDespesas.toFixed(2)}</div>
                  </div>
                </div>
                <div className="bg-blue-100 rounded-lg p-5 shadow-sm flex items-center gap-4">
                  <Scale className="w-10 h-10 text-blue-600" />
                  <div>
                    <div className="text-blue-700 font-semibold text-sm">Balance</div>
                    <div className="text-3xl font-bold text-blue-900">$ {report.balanco.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <h4 className="text-xl font-bold mb-4 text-gray-900">Detailed Records</h4>
              <div className="overflow-x-auto rounded-lg shadow-inner border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.registros.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${r.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {r.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold">
                          $ {r.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {r.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {r.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {r.date && new Date(r.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                          <button
                            onClick={() => handleEdit(r)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={loading || formLoading}
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={loading || formLoading}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {report.registros.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No records found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 p-8">
              No financial data available.
            </div>
          )}
        </div>
      </div>
      <FinancialCalendar/>
    </div>
  );
};

