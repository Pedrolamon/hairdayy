import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { PlusCircle, Pencil, Trash, CheckCircle, X, RefreshCcw } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

// Componente de Spinner customizado para botões
const ButtonSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.929l3-2.638z"></path>
  </svg>
);

export default function Services ()  {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [form, setForm] = useState({ id: '', name: '', duration: '', price: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Exibe uma mensagem temporária
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if ((editing || !editing) && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editing]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Service[]>("/services");
      setServices(data);
    } catch (error: any) {
      showMessage(error.message || 'Erro ao buscar serviços.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    // Validações
    if (Number(form.duration) <= 0) {
      showMessage('Duração deve ser maior que zero.', 'error');
      setFormLoading(false);
      return;
    }
    if (Number(form.price) < 0) {
      showMessage('Preço não pode ser negativo.', 'error');
      setFormLoading(false);
      return;
    }
    try {
      if (editing) {
        await api.put(`/services/${form.id}`, {
          name: form.name,
          duration: Number(form.duration),
          price: Number(form.price),
        });
        showMessage("Serviço atualizado com sucesso!", "success");
      } else {
        await api.post("/services", {
          name: form.name,
          duration: Number(form.duration),
          price: Number(form.price),
        });
        showMessage("Serviço adicionado com sucesso!", "success");
      }

      setForm({ id: '', name: '', duration: '', price: '' });
      setEditing(false);
      showMessage(editing ? 'Serviço atualizado com sucesso!' : 'Serviço adicionado com sucesso!', 'success');
      fetchServices();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao salvar serviço.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setForm({ id: service.id, name: service.name, duration: String(service.duration), price: String(service.price) });
    setEditing(true);
  };

  const handleDelete = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    setFormLoading(true);
    setIsDeleteModalOpen(false);

    try {
      await api.delete(`/services/${serviceToDelete.id}`,);
      showMessage('Serviço removido com sucesso!', 'success');
      fetchServices();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao remover serviço.', 'error');
    } finally {
      setFormLoading(false);
      setServiceToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setServiceToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased text-gray-800">
      {/* Mensagens de feedback (toast) */}
      {message.text && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up transition-all duration-300 ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && serviceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h4 className="text-xl font-bold mb-4">Confirmar Exclusão</h4>
            <p className="mb-6">Tem certeza que deseja remover o serviço **{serviceToDelete.name}**?</p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                onClick={cancelDelete}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                onClick={confirmDelete}
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Gerenciar Serviços</h2>

        {/* Formulário de Adição/Edição */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            {editing ? <Pencil className="w-6 h-6 text-yellow-500" /> : <PlusCircle className="w-6 h-6 text-blue-500" />}
            {editing ? 'Editar Serviço' : 'Novo Serviço'}
          </h3>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col col-span-1 md:col-span-1">
              <label htmlFor="serviceName" className="text-sm font-medium text-gray-600 mb-1">Nome</label>
              <input
                ref={nameInputRef}
                id="serviceName"
                name="name"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Corte de Cabelo"
                value={form.name}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="flex flex-col col-span-1">
              <label htmlFor="serviceDuration" className="text-sm font-medium text-gray-600 mb-1">Duração (min)</label>
              <input
                id="serviceDuration"
                name="duration"
                type="number"
                min="1"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 60"
                value={form.duration}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="flex flex-col col-span-1">
              <label htmlFor="servicePrice" className="text-sm font-medium text-gray-600 mb-1">Preço (R$)</label>
              <input
                id="servicePrice"
                name="price"
                type="number"
                step="0.01"
                min="0"
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 50.00"
                value={form.price}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-span-1 flex gap-2">
              <button
                type="submit"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${editing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                disabled={formLoading}
              >
                {formLoading ? <ButtonSpinner /> : (editing ? <><Pencil className="w-5 h-5" /> Atualizar</> : <><PlusCircle className="w-5 h-5" /> Adicionar</>)}
              </button>
              {editing && (
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                  onClick={() => { setForm({ id: '', name: '', duration: '', price: '' }); setEditing(false); }}
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Serviços */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Serviços Cadastrados</h3>
          {loading && <div className="text-center text-gray-500 py-8">Carregando serviços...</div>}
          {!loading && services.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Nenhum serviço cadastrado. Comece adicionando um novo serviço acima.
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {services.map(service => (
              <div key={service.id} className="border border-gray-200 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between transition hover:shadow-md">
                <div className="mb-2 md:mb-0">
                  <div className="text-lg font-semibold">{service.name}</div>
                  <div className="text-sm text-gray-600">Duração: {service.duration} min</div>
                  <div className="text-md font-bold text-blue-600">R$ {Number(service.price).toFixed(2)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 hover:bg-yellow-600 transition"
                    onClick={() => handleEdit(service)}
                    disabled={formLoading}
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 hover:bg-red-700 transition"
                    onClick={() => handleDelete(service)}
                    disabled={formLoading}
                  >
                    <Trash className="w-4 h-4" />
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

