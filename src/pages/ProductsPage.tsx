import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { api } from '../lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  stockValue: number;
  category?: string;
  active: boolean;
}

const LoadingSpinner = ({ size = '20', color = '#fff' }: { size?: string; color?: string }) => (
  <div
    style={{ width: size, height: size, borderTopColor: color }}
    className="animate-spin rounded-full border-2 border-solid border-white border-opacity-20"
  />
);

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Partial<Product>>({ active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [calculatedStockValue, setCalculatedStockValue] = useState(0);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (form.price !== undefined && form.stock !== undefined) {
      setCalculatedStockValue(Number(form.price) * Number(form.stock));
    } else {
      setCalculatedStockValue(0);
    }
  }, [form.price, form.stock]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get(`/products`);
      setProducts(res.data);
    } catch (e) {
      showMessage('Network error while loading products.', 'error');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleEdit = (p: Product) => {
    setForm(p);
    setEditingId(p.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      showMessage('Product removed!', 'success');
      fetchProducts();
    } catch {
      showMessage('Network error while removing product.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const method = editingId ? 'put' : 'post';
    const url = editingId ? `/products/${editingId}` : '/products';
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock), stockValue: calculatedStockValue };
    try {
      const res = await api[method](url, payload);
      if (res.status >= 200 && res.status < 300) {
        showMessage(editingId ? 'Product updated!' : 'Product added!', 'success');
        setForm({ active: true });
        setEditingId(null);
        fetchProducts();
      }
    } catch {
      showMessage('Network error: Unable to connect to server.', 'error');
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
            <Pencil className="w-8 h-8" />
            Gerenciar Produtos
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              required
              type="text"
              placeholder="Product Name"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              required
              type="number"
              min={0}
              step={0.01}
              placeholder="Purchase Price"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={form.price || ''}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            />
            <input
              required
              type="number"
              min={0}
              placeholder="Amount"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={form.stock || ''}
              onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            />
            <input
              type="text"
              placeholder="Category"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={form.category || ''}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active !== false}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="flex col-span-1 md:col-span-2 lg:col-span-3 items-center justify-end gap-2">
              {editingId && (
                <button
                  type="button"
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                  onClick={() => {
                    setForm({ active: true });
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <LoadingSpinner color="#fff" />
                ) : (
                  <>
                    {editingId ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                    {editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-lg shadow-inner border border-gray-200">
            {loadingProducts ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner size="50" color="#4F46E5" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((p) => (
                    <tr key={p.id} className={!p.active ? 'bg-gray-100 opacity-70' : 'hover:bg-gray-50 transition'}>
                      <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">$ {Number(p.price).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap">$ {Number(p.stockValue || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.category || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.active ? 'Sim' : 'Não'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-900">
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && !loadingProducts && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;