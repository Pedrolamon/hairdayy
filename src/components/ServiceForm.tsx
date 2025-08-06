import React, { useState } from 'react';

type ServiceFormProps = {
  onSave: (service: { name: string; duration: number; price: number }) => void;
  onCancel: () => void;
  initialData?: { name: string; duration: number; price: number };
};

const ServiceForm: React.FC<ServiceFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [duration, setDuration] = useState(initialData?.duration?.toString() || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration || !price) {
      setError('Preencha todos os campos.');
      return;
    }
    setError('');
    onSave({ name, duration: Number(duration), price: Number(price) });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded p-4 mb-6 flex flex-col gap-2">
      <h2 className="text-lg font-bold mb-2">Novo Serviço</h2>
      <input
        placeholder="Nome do serviço"
        value={name}
        onChange={e => setName(e.target.value)}
        className="border rounded px-2 py-1"
        required
      />
      <input
        placeholder="Duração em minutos"
        type="number"
        min={1}
        value={duration}
        onChange={e => setDuration(e.target.value)}
        className="border rounded px-2 py-1"
        required
      />
      <input
        placeholder="Preço"
        type="number"
        min={0}
        step={0.01}
        value={price}
        onChange={e => setPrice(e.target.value)}
        className="border rounded px-2 py-1"
        required
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2 mt-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
        <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
};

export default ServiceForm; 