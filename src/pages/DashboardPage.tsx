import { api } from '../lib/api';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement);

// Componente de Spinner customizado
const LoadingSpinner = ({ size = '20', color = '#fff' }: { size?: string; color?: string }) => (
  <div
    style={{ width: size, height: size, borderTopColor: color }}
    className="animate-spin rounded-full border-2 border-solid border-white border-opacity-20"
  />
);



export default function Dashboard () {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [filters, setFilters] = useState<{ start: string; end: string; barberId: string }>({ start: '', end: '', barberId: '' });

  const { isAuth, isLoading } = useAuth();

  // Exibe uma mensagem temporária
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000); 
  };

  const fetchDashboard = async () => {
    if (!isAuth) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start) params.append('start', filters.start);
      if (filters.end) params.append('end', filters.end);
      if (filters.barberId) params.append('barberId', filters.barberId);

        const res = await api.get('/dashboard', {
        params: filters, 
      });
      setData(res.data);
      showMessage('Dashboard carregado com sucesso!', 'success');
      
    } catch (error: any) {
      console.error("🚨 Erro ao carregar o dashboard:", error);
      showMessage(error.message, 'error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };


  // Efeito para buscar os dados do dashboard
  useEffect(() => {
    fetchDashboard();
  }, [filters, isAuth, isLoading]);

  // Seção de Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <LoadingSpinner size="60" color="#4F46E5" />
      </div>
    );
  }

   if (!isAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="text-red-500 font-semibold mb-4">
          Você não está autenticado. Faça login para acessar o dashboard.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <LoadingSpinner size="60" color="#4F46E5" />
      </div>
    );
  }

  // Seção de Erro
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="text-red-500 font-semibold mb-4">
          Ocorreu um erro ao carregar o dashboard.
        </div>
        <button
          onClick={fetchDashboard}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Dados para gráficos
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };
  const days = Object.keys(data.appointmentsByDay).sort();
  const appointmentsPerDay = days.map(d => data.appointmentsByDay[d]);
  const salesDays = Object.keys(data.salesByDay).sort();
  const salesPerDay = salesDays.map(d => data.salesByDay[d]);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased text-gray-800">
      {/* Mensagens de feedback (toast) */}
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
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Dashboard de Análise</h2>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Search className="w-6 h-6 text-gray-500" />
            Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-600 mb-1">Data inicial</label>
              <input
                id="startDate"
                type="date"
                value={filters.start}
                onChange={e => setFilters(f => ({ ...f, start: e.target.value }))}
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-600 mb-1">Data final</label>
              <input
                id="endDate"
                type="date"
                value={filters.end}
                onChange={e => setFilters(f => ({ ...f, end: e.target.value }))}
                className="border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
              onClick={() => setFilters({ start: '', end: '', barberId: '' })}
            >
              <RefreshCcw className="w-5 h-5" />
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
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
              <div className="text-4xl font-bold">R$ {Number(data.totalRevenue).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Seção de Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Agendamentos por Dia</h3>
            <Line
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
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
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Vendas por Dia</h3>
            <Bar
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { display: true, text: 'Vendas Diárias' },
                },
              }}
              data={{
                labels: salesDays,
                datasets: [{ label: 'Vendas', data: salesPerDay, backgroundColor: '#22c55e' }],
              }}
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Top Serviços</h3>
            <div className="w-full h-80">
              <Pie
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'right' as const,
                    },
                    title: { display: true, text: 'Serviços Mais Populares' },
                  },
                }}
                data={{
                  labels: data.topServices.map((s: any) => s[0]),
                  datasets: [{
                    data: data.topServices.map((s: any) => s[1]),
                    backgroundColor: ['#2563eb', '#22c55e', '#f59e42', '#a78bfa', '#f43f5e'],
                    hoverBackgroundColor: ['#1d4ed8', '#15803d', '#d97706', '#9333ea', '#be123c'],
                  }],
                }}
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Top Barbeiros</h3>
            <div className="w-full h-80">
              <Pie
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'right' as const,
                    },
                    title: { display: true, text: 'Barbeiros com Mais Vendas' },
                  },
                }}
                data={{
                  labels: data.topBarbers.map((b: any) => b[0]),
                  datasets: [{
                    data: data.topBarbers.map((b: any) => b[1]),
                    backgroundColor: ['#a78bfa', '#f59e42', '#2563eb', '#22c55e', '#f43f5e'],
                    hoverBackgroundColor: ['#9333ea', '#d97706', '#1d4ed8', '#15803d', '#be123c'],
                  }],
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

