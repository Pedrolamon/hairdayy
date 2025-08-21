import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Pencil, Trash2, PlusCircle, ShoppingCart } from 'lucide-react';
import { api } from '../lib/api';

// Interfaces para os tipos de dados
interface Product {
  id: string; // Mudado para string para corresponder ao backend
  name: string;
  price: number;
  stock: number;
  category?: string;
  active: boolean;
}

interface Sale {
  id: string; // Assumindo que o id da venda também é uma string
  date: string;
  total: number;
  clientName?: string;
  products: Product[];
  quantities: { [productId: string]: number }; // ID do produto é uma string
}

// Componente de Spinner customizado para remover a dependência externa
const LoadingSpinner = ({ size = '20', color = '#fff' }: { size?: string; color?: string }) => (
  <div
    style={{ width: size, height: size, borderTopColor: color }}
    className="animate-spin rounded-full border-2 border-solid border-white border-opacity-20"
  />
);

export default function Products () {
  // Estados da aplicação
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState<Partial<Product>>({ active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saleForm, setSaleForm] = useState<{ clientName: string; items: { productId: string; qty: number }[] }>({ clientName: '', items: [] });

  // Estados de feedback visual
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  // Exibe uma mensagem temporária
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000); 
  };

   useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  // Funções para buscar dados
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get(`/products`);
        setProducts(res.data);
    } catch (e) {
      showMessage('Erro de rede ao carregar produtos.', 'error');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const res = await api.get(`/sales`)
        setSales(res.data);
    } catch (e) {
      showMessage('Erro de rede ao carregar vendas.', 'error');
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  };
 

  // Funções para manipulação de produtos
  const handleEdit = (p: Product) => {
    setForm(p);
    setEditingId(p.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este produto?')) return;

    try {
      await api.delete(`/products/${id}`);
      showMessage('Produto removido!', 'success');
      fetchProducts();
    } catch {
      showMessage('Erro de rede ao remover produto.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const method = editingId ? 'put' : 'post';
    const url = editingId ? `/products/${editingId}` : '/products';
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
       const res = await api[method](url, payload); // Usando axios com a rota correta
    if (res.status >= 200 && res.status < 300) {
      showMessage(editingId ? 'Produto atualizado!' : 'Produto adicionado!', 'success');
      setForm({ active: true });
      setEditingId(null);
      fetchProducts();
    }
    } catch {
      showMessage('Erro de rede: não foi possível conectar ao servidor.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Funções para manipulação de vendas
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
      return showMessage('Selecione ao menos um produto.', 'error');
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
        await api.post('/sales',payload );
        showMessage('Venda registrada!', 'success');
        setSaleForm({ clientName: '', items: [] });
        fetchProducts();
        fetchSales();
    } catch {
      showMessage('Erro de rede: não foi possível conectar ao servidor.', 'error');
    } finally {
      setSaleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased text-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Mensagens de feedback */}
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

          {/* Formulário de Produto */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              required
              type="text"
              placeholder="Nome do Produto"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              required
              type="number"
              min={0}
              step={0.01}
              placeholder="Preço"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={form.price || ''}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            />
            <input
              required
              type="number"
              min={0}
              placeholder="Estoque"
              className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={form.stock || ''}
              onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            />
            <input
              type="text"
              placeholder="Categoria"
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
                <span className="text-sm">Ativo</span>
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
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                disabled={ formLoading}
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

          {/* Tabela de Produtos */}
          <div className="overflow-x-auto rounded-lg shadow-inner border border-gray-200">
            {loadingProducts ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner size="50" color="#4F46E5" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((p) => (
                    <tr key={p.id} className={!p.active ? 'bg-gray-100 opacity-70' : 'hover:bg-gray-50 transition'}>
                      <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">R$ {Number(p.price).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.stock}</td>
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
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Seção de Vendas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Registrar Venda
          </h3>

          {/* Formulário de Venda */}
          <form onSubmit={handleSaleSubmit} className="grid grid-cols-1 gap-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Nome do Cliente (opcional)"
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
                    <span className="text-xs text-gray-600">Estoque: {p.stock}</span>
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
                  Registrar Venda
                </>
              )}
            </button>
          </form>

          {/* Histórico de Vendas */}
          <h3 className="text-2xl font-bold mb-4 mt-8 text-gray-900">Histórico de Vendas</h3>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produtos</th>
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
                        Nenhuma venda encontrada.
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

