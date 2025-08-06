import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

const BarberServices: React.FC = () => {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id: 0, name: '', duration: '', price: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if ((editing || !editing) && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editing]);

  const fetchServices = () => {
    setLoading(true);
    setError('');
    fetch('/api/services', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao buscar serviços.');
        setLoading(false);
      });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    if (Number(form.duration) <= 0) {
      setFormError('Duração deve ser maior que zero.');
      setFormLoading(false);
      return;
    }
    if (Number(form.price) < 0) {
      setFormError('Preço não pode ser negativo.');
      setFormLoading(false);
      return;
    }
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/services/${form.id}` : '/api/services';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          duration: Number(form.duration),
          price: Number(form.price),
        }),
      });
      if (!res.ok) throw new Error();
      setForm({ id: 0, name: '', duration: '', price: '' });
      setEditing(false);
      setFormSuccess(editing ? 'Serviço atualizado com sucesso!' : 'Serviço adicionado com sucesso!');
      fetchServices();
    } catch {
      setFormError('Erro ao salvar serviço.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setForm({ id: service.id, name: service.name, duration: String(service.duration), price: String(service.price) });
    setEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este serviço?')) return;
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchServices();
    } catch {
      setFormError('Erro ao remover serviço.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Serviços</h3>
      <form onSubmit={handleFormSubmit} className="bg-gray-50 rounded p-4 mb-6 flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
        <input ref={nameInputRef} name="name" className="border rounded px-2 py-1" placeholder="Nome do serviço" value={form.name} onChange={handleFormChange} required />
        <input
          name="duration"
          type="number"
          min="1"
          className="border rounded px-2 py-1"
          placeholder="Duração (min)"
          value={form.duration}
          onChange={handleFormChange}
          required
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          className="border rounded px-2 py-1"
          placeholder="Preço"
          value={form.price}
          onChange={handleFormChange}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={formLoading}
        >
          {formLoading ? 'Salvando...' : (editing ? 'Atualizar' : 'Adicionar')}
        </button>
        {editing && (
          <button
            type="button"
            className="text-sm text-gray-500 hover:underline"
            onClick={() => { setForm({ id: 0, name: '', duration: '', price: '' }); setEditing(false); }}
          >
            Cancelar edição
          </button>
        )}
        {formError && <div className="text-red-500 text-sm">{formError}</div>}
        {formSuccess && <div className="text-green-600 text-sm">{formSuccess}</div>}
      </form>
      {loading && <div className="text-gray-500">Carregando serviços...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="divide-y">
        {services.map(service => (
          <li key={service.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <span className="font-semibold">{service.name}</span>
              <span className="ml-2 text-gray-500 text-sm">{service.duration} min</span>
              <span className="ml-2 text-blue-700 font-bold">R$ {service.price.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={() => handleEdit(service)} disabled={formLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6l9-9a2.828 2.828 0 10-4-4l-9 9z" /></svg>
                Editar
              </button>
              <button className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1" onClick={() => handleDelete(service.id)} disabled={formLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Remover
              </button>
            </div>
          </li>
        ))}
        {services.length === 0 && !loading && <li className="text-gray-500">Nenhum serviço cadastrado.</li>}
      </ul>
    </div>
  );
};

export default BarberServices; 