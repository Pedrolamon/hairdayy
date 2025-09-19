import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { api } from '../lib/api';
import NotificationBroadcast from '../components/NotificationBroadcast';

// Charts
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';

// Icons
import {
  CalendarDays,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Search,
  CheckCircle,
  X,
  RefreshCcw,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

// Loading spinner 
const LoadingSpinner = ({ size = 20 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: '3px solid rgba(255,255,255,0.2)',
      borderTopColor: '#4F46E5',
    }}
    className="animate-spin"
  />
);

// Tipos
type Role = 'ADMIN' | 'BARBER' | 'CLIENT';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

type TopItemTuple = [string, number];

interface DashboardData {
  totalAppointments: number;
  totalSales: number;
  totalProductsSold: number;
  totalRevenue: number;
  appointmentsByDay: Record<string, number>;
  salesByDay: Record<string, number>;
  topServices: TopItemTuple[];
  topBarbers: TopItemTuple[];
  barbers: Barber[];
}

const AdminDashboard: React.FC = () => {
  const { user: currentUserFromHook } = useAuth() as { user?: User | null } || {};
  const currentUser: User = currentUserFromHook ?? { id: 'admin-123', name: 'Admin Master', role: 'ADMIN' };

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [filters, setFilters] = useState<{ start: string; end: string; barberId: string }>({
    start: '',
    end: '',
    barberId: '',
  });

  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberEmail, setNewBarberEmail] = useState('');
  const [newBarberCredentials, setNewBarberCredentials] = useState<{ id: string; tempPassword: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchAdminDashboard = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.start) params.start = filters.start;
      if (filters.end) params.end = filters.end;
      if (filters.barberId) params.barberId = filters.barberId;

      const res = await api.get('/admin/dashboard', { params, signal });
      setData(res.data);
      showMessage('Dashboard carregado com sucesso!', 'success');
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.message === 'canceled') {
        return;
      }
      console.error('🚨 Erro ao carregar o dashboard:', error);
      showMessage(error?.response?.data?.message || error.message || 'Ocorreu um erro ao carregar o dashboard.', 'error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminDashboard(controller.signal);
    return () => controller.abort();
  }, [filters.start, filters.end, filters.barberId]);

  const handleCreateBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName.trim() || !newBarberEmail.trim()) {
      showMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/admin/barbers', {
        name: newBarberName.trim(),
        email: newBarberEmail.trim(),
      });
      const { barber, tempPassword } = res.data;
  
      if (barber && tempPassword) {
        setNewBarberCredentials({ id: barber.id, tempPassword });
      } else {
        setNewBarberCredentials(null);
      }

      await fetchAdminDashboard();
      setNewBarberName('');
      setNewBarberEmail('');
      showMessage('Barbeiro criado com sucesso!', 'success');
    } catch (error: any) {
      console.error('🚨 Erro ao criar o barbeiro:', error);
      showMessage(error?.response?.data?.message || error.message || 'Ocorreu um erro ao criar o barbeiro.', 'error');
    } finally {
      setActionLoading(false);
    }
  };


  const handleEditBarber = async (barber: Barber) => {
    const newName = window.prompt('Novo nome do barbeiro:', barber.name);
    if (newName === null) return; 
    const newEmail = window.prompt('Novo email do barbeiro:', barber.email);
    if (newEmail === null) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/barbers/${barber.id}`, { name: newName.trim(), email: newEmail.trim() });
      await fetchAdminDashboard();
      showMessage('Barbeiro atualizado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao editar barbeiro:', error);
      showMessage(error?.response?.data?.message || error.message || 'Erro ao editar barbeiro', 'error');
    } finally {
      setActionLoading(false);
    }
  };


  const handleDeleteBarber = async (barber: Barber) => {
    const ok = window.confirm(`Deseja realmente excluir o barbeiro "${barber.name}"? Essa ação não pode ser desfeita.`);
    if (!ok) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/barbers/${barber.id}`);
      await fetchAdminDashboard();
      showMessage('Barbeiro excluído com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao excluir barbeiro:', error);
      showMessage(error?.response?.data?.message || error.message || 'Erro ao excluir barbeiro', 'error');
    } finally {
      setActionLoading(false);
    }
  };


  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="text-red-500 font-semibold mb-4">Você não está autorizado a acessar este painel.</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="text-red-500 font-semibold mb-4">Ocorreu um erro ao carregar o dashboard.</div>
        <button
          onClick={() => fetchAdminDashboard()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const days = Object.keys(data.appointmentsByDay).sort();
  const appointmentsPerDay = days.map((d) => data.appointmentsByDay[d] ?? 0);
  const salesDays = Object.keys(data.salesByDay).sort();
  const salesPerDay = salesDays.map((d) => data.salesByDay[d] ?? 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased text-gray-800">
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

      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Dashboard do Administrador</h2>

        {/* Notificação em Massa */}
        <div className="mb-8">
          <NotificationBroadcast />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Criar Novo Barbeiro</h3>
            <form onSubmit={handleCreateBarber} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={newBarberName}
                  onChange={(e) => setNewBarberName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do Barbeiro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newBarberEmail}
                  onChange={(e) => setNewBarberEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {actionLoading ? 'Salvando...' : 'Criar Barbeiro'}
              </button>
            </form>

            {newBarberCredentials && (
              <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200">
                <h4 className="font-semibold mb-2">Barbeiro criado com sucesso!</h4>
                <p>
                  ID: <strong>{newBarberCredentials.id}</strong>
                </p>
                <p>
                  Senha Temporária: <strong>{newBarberCredentials.tempPassword}</strong>
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Meus Barbeiros</h3>
            <ul className="space-y-3">
              {data.barbers.map((barber) => (
                <li
                  key={barber.id}
                  className="p-4 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center border border-gray-200"
                >
                  <div>
                    <div className="text-gray-800 font-medium">{barber.name}</div>
                    <div className="text-sm text-gray-500">{barber.email}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditBarber(barber)}
                      className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteBarber(barber)}
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Search className="w-6 h-6 text-gray-500" />
            Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-600 mb-1">
                Data inicial
              </label>
              <input
                id="startDate"
                type="date"
                value={filters.start}
                onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value }))}
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-600 mb-1">
                Data final
              </label>
              <input
                id="endDate"
                type="date"
                value={filters.end}
                onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))}
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="barberId" className="text-sm font-medium text-gray-600 mb-1">
                Barbeiro
              </label>
              <select
                id="barberId"
                value={filters.barberId}
                onChange={(e) => setFilters((f) => ({ ...f, barberId: e.target.value }))}
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {data.barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setFilters({ start: '', end: '', barberId: '' })}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 text-white rounded-lg p-6 shadow-xl flex items-center gap-4">
            <CalendarDays className="w-10 h-10" />
            <div>
              <div className="text-sm font-semibold opacity-80">Total de Agendamentos</div>
              <div className="text-4xl font-bold">{data.totalAppointments}</div>
            </div>
          </div>
          <div className="bg-green-600 text-white rounded-lg p-6 shadow-xl flex items-center gap-4">
            <ShoppingCart className="w-10 h-10" />
            <div>
              <div className="text-sm font-semibold opacity-80">Total de Vendas</div>
              <div className="text-4xl font-bold">{data.totalSales}</div>
            </div>
          </div>
          <div className="bg-yellow-500 text-white rounded-lg p-6 shadow-xl flex items-center gap-4">
            <TrendingUp className="w-10 h-10" />
            <div>
              <div className="text-sm font-semibold opacity-80">Produtos Vendidos</div>
              <div className="text-4xl font-bold">{data.totalProductsSold}</div>
            </div>
          </div>
          <div className="bg-purple-600 text-white rounded-lg p-6 shadow-xl flex items-center gap-4">
            <DollarSign className="w-10 h-10" />
            <div>
              <div className="text-sm font-semibold opacity-80">Faturamento Total</div>
              <div className="text-4xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg h-96">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Agendamentos por Dia</h3>
            <Line
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' as const },
                  title: { display: true, text: 'Agendamentos Diários' },
                },
              }}
              data={{
                labels: days,
                datasets: [
                  {
                    label: 'Agendamentos',
                    data: appointmentsPerDay,
                    borderColor: '#3b82f6',
                    backgroundColor: '#dbeafe',
                    tension: 0.4,
                    fill: true,
                  },
                ],
              }}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg h-96">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Vendas por Dia</h3>
            <Bar
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' as const },
                  title: { display: true, text: 'Vendas Diárias' },
                },
              }}
              data={{
                labels: salesDays,
                datasets: [{ label: 'Vendas', data: salesPerDay, backgroundColor: '#22c55e' }],
              }}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg h-96 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Top Serviços</h3>
            <div className="w-full flex-grow">
              <Pie
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' as const },
                    title: { display: true, text: 'Serviços Mais Populares' },
                  },
                }}
                data={{
                  labels: data.topServices.map((s) => s[0]),
                  datasets: [
                    {
                      data: data.topServices.map((s) => s[1]),
                      backgroundColor: ['#2563eb', '#22c55e', '#f59e42', '#a78bfa', '#f43f5e'],
                      hoverBackgroundColor: ['#1d4ed8', '#15803d', '#d97706', '#9333ea', '#be123c'],
                    },
                  ],
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg h-96 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Top Barbeiros</h3>
            <div className="w-full flex-grow">
              <Pie
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' as const },
                    title: { display: true, text: 'Barbeiros com Mais Vendas' },
                  },
                }}
                data={{
                  labels: data.topBarbers.map((b) => b[0]),
                  datasets: [
                    {
                      data: data.topBarbers.map((b) => b[1]),
                      backgroundColor: ['#a78bfa', '#f59e42', '#2563eb', '#22c55e', '#f43f5e'],
                      hoverBackgroundColor: ['#9333ea', '#d97706', '#1d4ed8', '#15803d', '#be123c'],
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
