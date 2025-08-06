import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import BarberAgenda from './BarberAgenda';
import BarberFinancial from './BarberFinancial';
import BarberServices from './BarberServices';
import BarberAvailability from './BarberAvailability';
import BarberClients from './BarberClients';
import BarberProducts from './BarberProducts';
import BarberDashboard from './BarberDashboard';
import BarberBarbers from './BarberBarbers';
import NotificationPanel from './NotificationPanel';
import UnitSelector from './UnitSelector';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'services', label: 'Serviços' },
  { key: 'financial', label: 'Financeiro' },
  { key: 'availability', label: 'Disponibilidade' },
  { key: 'clients', label: 'Clientes' },
  { key: 'products', label: 'Produtos' },
  { key: 'barbers', label: 'Barbeiros' },
  { key: 'notifications', label: 'Notificações' },
];

const BarberPanel: React.FC = () => {
  const { user, logout, login } = useAuth();
  const [tab, setTab] = useState<'dashboard' | 'agenda' | 'services' | 'financial' | 'availability' | 'clients' | 'products' | 'barbers' | 'notifications'>('dashboard');

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Painel do Barbeiro/Admin</h2>
        <button onClick={logout} className="text-red-600 font-bold">Sair</button>
      </div>
      <UnitSelector />
      <div className="mb-2">Bem-vindo, <span className="font-semibold">{user.name}</span>!</div>
      <div className="flex gap-4 border-b mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`pb-2 px-2 font-semibold border-b-2 ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setTab(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <BarberDashboard />}
      {tab === 'agenda' && <BarberAgenda />}
      {tab === 'services' && <BarberServices />}
      {tab === 'financial' && <BarberFinancial />}
      {tab === 'availability' && <BarberAvailability />}
      {tab === 'clients' && <BarberClients />}
      {tab === 'products' && <BarberProducts />}
      {tab === 'barbers' && <BarberBarbers />}
      {tab === 'notifications' && <NotificationPanel />}
    </div>
  );
};

export default BarberPanel; 