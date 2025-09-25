import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShoppingCart } from 'lucide-react';
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

interface Sale {
  id: string;
  date: string;
  total: number;
  clientName?: string;
  products: Product[];
  quantities: { [productId: string]: number };
}

const LoadingSpinner = ({ size = '20', color = '#fff' }: { size?: string; color?: string }) => (
  <div
    style={{ width: size, height: size, borderTopColor: color }}
    className="animate-spin rounded-full border-2 border-solid border-white border-opacity-20"
  />
);

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleForm, setSaleForm] = useState<{ clientName: string; items: { productId: string; qty: number }[] }>({ clientName: '', items: [] });
  const [loadingSales, setLoadingSales] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products`);
      setProducts(res.data);
    } catch (e) {
      showMessage('Network error while loading products.', 'error');
      setProducts([]);
    }
  };

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const res = await api.get(`/sales`);
      setSales(res.data);
    } catch (e) {
      showMessage('Network error loading sales.', 'error');
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleSaleChange = (productId: string, qty: number) => {
    setSaleForm((prev) => {
      const items = prev.items.filter((i) => i.productId !== productId);
      if (qty > 0) items.push({ productId, qty });
      return { ...prev, items };
    });
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleForm.items.length === 0) {
      return showMessage('Select at least one product.', 'error');
    }

    setSaleLoading(true);
    const quantities: { [id: string]: number } = {};
    let total = 0;
    for (const item of saleForm.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        quantities[item.productId] = item.qty;
        total += Number(prod.price) * item.qty;
      }
    }
    const payload = {
      clientName: saleForm.clientName,
      products: saleForm.items.map((i) => i.productId),
      quantities,
      total,
    };

    try {
      await api.post('/sales', payload);
      showMessage('Registered sale!', 'success');
      setSaleForm({ clientName: '', items: [] });
      fetchProducts();
      fetchSales();
    } catch {
      showMessage('Network error: Could not connect to the server.', 'error');
    } finally {
      setSaleLoading(false);
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

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Register Sale
          </h3>

          <form onSubmit={handleSaleSubmit} className="grid grid-cols-1 gap-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Customer Name (optional)"
                className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={saleForm.clientName}
                onChange={(e) => setSaleForm((f) => ({ ...f, clientName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 border p-4 rounded-lg bg-gray-50">
              {products
                .filter((p) => p.active && p.stock > 0)
                .map((p) => (
                  <div key={p.id} className="flex flex-col gap-1 items-start">
                    <span className="font-semibold text-sm">{p.name}</span>
                    <span className="text-xs text-gray-600">Stock: {p.stock}</span>
                    <input
                      type="number"
                      min={0}
                      max={p.stock}
                      placeholder="Qtd."
                      value={saleForm.items.find((i) => i.productId === p.id)?.qty || ''}
                      onChange={(e) => handleSaleChange(p.id, Number(e.target.value))}
                      className="border border-gray-300 w-24 p-1 rounded-lg focus:ring-blue-500 focus:border-blue-500 mt-1"
                    />
                  </div>
                ))}
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              disabled={saleLoading}
            >
              {saleLoading ? (
                <LoadingSpinner color="#fff" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Register Sale
                </>
              )}
            </button>
          </form>

          <h3 className="text-2xl font-bold mb-4 mt-8 text-gray-900">Sales History</h3>
          <div className="overflow-x-auto rounded-lg shadow-inner border border-gray-200">
            {loadingSales ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner size="50" color="#4F46E5" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(s.date).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{s.clientName || '-'}</td>
                      <td className="px-6 py-4">
                        {s.products.map((p) => `${p.name} (x${s.quantities[p.id] || 0})`).join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">R$ {Number(s.total).toFixed(2)}</td>
                    </tr>
                  ))}
                  {sales.length === 0 && !loadingSales && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No sales found.
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

export default Sales;