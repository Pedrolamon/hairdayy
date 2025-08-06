import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
  active: boolean;
}

interface Sale {
  id: number;
  date: string;
  total: number;
  clientName?: string;
  products: Product[];
  quantities: { [productId: number]: number };
}

const BarberProducts: React.FC = () => {
  const { token } = useAuth();
  const { unit } = useUnit();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState<Partial<Product>>({ active: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saleForm, setSaleForm] = useState<{ clientName: string; items: { productId: number; qty: number }[] }>({ clientName: '', items: [] });
  const [msg, setMsg] = useState('');

  // Fetch products
  const fetchProducts = async () => {
    if (!unit) return;
    const res = await fetch(`/api/products?unitId=${unit.id}`, { headers: { Authorization: `Bearer ${token}` } });
    setProducts(await res.json());
  };
  // Fetch sales
  const fetchSales = async () => {
    if (!unit) return;
    const res = await fetch(`/api/sales?unitId=${unit.id}`, { headers: { Authorization: `Bearer ${token}` } });
    setSales(await res.json());
  };
  useEffect(() => { fetchProducts(); fetchSales(); }, []);

  // Add or edit product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, unitId: unit.id }),
    });
    if (res.ok) {
      setMsg(editingId ? 'Produto atualizado!' : 'Produto adicionado!');
      setForm({ active: true });
      setEditingId(null);
      fetchProducts();
    } else {
      setMsg('Erro ao salvar produto.');
    }
  };
  // Edit
  const handleEdit = (p: Product) => {
    setForm(p);
    setEditingId(p.id);
  };
  // Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Remover produto?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setMsg('Produto removido!');
      fetchProducts();
    } else {
      setMsg('Erro ao remover produto.');
    }
  };
  // Sale form handlers
  const handleSaleChange = (productId: number, qty: number) => {
    setSaleForm((prev) => {
      const items = prev.items.filter((i) => i.productId !== productId);
      if (qty > 0) items.push({ productId, qty });
      return { ...prev, items };
    });
  };
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    if (saleForm.items.length === 0) return setMsg('Selecione ao menos um produto.');
    const quantities: { [id: number]: number } = {};
    let total = 0;
    for (const item of saleForm.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        quantities[item.productId] = item.qty;
        total += Number(prod.price) * item.qty;
      }
    }
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ clientName: saleForm.clientName, products: saleForm.items.map(i => i.productId), quantities, total, unitId: unit.id }),
    });
    if (res.ok) {
      setMsg('Venda registrada!');
      setSaleForm({ clientName: '', items: [] });
      fetchProducts();
      fetchSales();
    } else {
      setMsg('Erro ao registrar venda.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Produtos</h2>
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2 items-end">
        <input required placeholder="Nome" className="border p-1" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input required type="number" min={0} step={0.01} placeholder="Preço" className="border p-1" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
        <input required type="number" min={0} placeholder="Estoque" className="border p-1" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
        <input placeholder="Categoria" className="border p-1" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={form.active !== false} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /> Ativo
        </label>
        <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded">{editingId ? 'Salvar' : 'Adicionar'}</button>
        {editingId && <button type="button" className="ml-2" onClick={() => { setForm({ active: true }); setEditingId(null); }}>Cancelar</button>}
      </form>
      <table className="w-full mb-6 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Nome</th>
            <th className="border p-1">Preço</th>
            <th className="border p-1">Estoque</th>
            <th className="border p-1">Categoria</th>
            <th className="border p-1">Ativo</th>
            <th className="border p-1">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={!p.active ? 'opacity-50' : ''}>
              <td className="border p-1">{p.name}</td>
              <td className="border p-1">R$ {Number(p.price).toFixed(2)}</td>
              <td className="border p-1">{p.stock}</td>
              <td className="border p-1">{p.category}</td>
              <td className="border p-1">{p.active ? 'Sim' : 'Não'}</td>
              <td className="border p-1 flex gap-2">
                <button onClick={() => handleEdit(p)} className="text-blue-600">Editar</button>
                <button onClick={() => handleDelete(p.id)} className="text-red-600">Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="font-bold mb-2">Registrar Venda</h3>
      <form onSubmit={handleSaleSubmit} className="mb-6 flex flex-wrap gap-2 items-end">
        <input placeholder="Cliente (opcional)" className="border p-1" value={saleForm.clientName} onChange={e => setSaleForm(f => ({ ...f, clientName: e.target.value }))} />
        {products.filter(p => p.active && p.stock > 0).map(p => (
          <label key={p.id} className="flex items-center gap-1">
            <span>{p.name} (Estoque: {p.stock})</span>
            <input type="number" min={0} max={p.stock} value={saleForm.items.find(i => i.productId === p.id)?.qty || ''} onChange={e => handleSaleChange(p.id, Number(e.target.value))} className="border w-16 p-1" />
          </label>
        ))}
        <button type="submit" className="bg-green-600 text-white px-2 py-1 rounded">Registrar Venda</button>
      </form>
      <h3 className="font-bold mb-2">Histórico de Vendas</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Data</th>
            <th className="border p-1">Cliente</th>
            <th className="border p-1">Produtos</th>
            <th className="border p-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(s => (
            <tr key={s.id}>
              <td className="border p-1">{new Date(s.date).toLocaleString()}</td>
              <td className="border p-1">{s.clientName || '-'}</td>
              <td className="border p-1">
                {s.products.map(p => `${p.name} (x${s.quantities[p.id]})`).join(', ')}
              </td>
              <td className="border p-1">R$ {Number(s.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BarberProducts; 