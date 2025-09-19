import { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Award,
  BarChart3
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ClientAnalyticsProps {
  data: {
    totalUniqueClients: number;
    newClientsThisMonth: number;
    recurringClients: number;
    topLoyalClients: Array<{
      clientId: string | null;
      clientName: string;
      appointmentCount: number;
    }>;
    newClientsList: Array<{
      clientId: string | null;
      clientName: string;
      firstAppointmentDate: string;
    }>;
  };
}

export default function ClientAnalytics({ data }: ClientAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'loyalty' | 'growth'>('overview');

  // Dados para o gráfico de distribuição de clientes
  const clientDistributionData = {
    labels: ['Novos Clientes', 'Clientes Recorrentes'],
    datasets: [
      {
        data: [data.newClientsThisMonth, data.recurringClients],
        backgroundColor: ['#10B981', '#8B5CF6'],
        borderColor: ['#059669', '#7C3AED'],
        borderWidth: 2,
      },
    ],
  };

  // Dados para o gráfico de top clientes
  const topClientsData = {
    labels: data.topLoyalClients.slice(0, 5).map(client => 
      client.clientName.length > 15 
        ? client.clientName.substring(0, 15) + '...' 
        : client.clientName
    ),
    datasets: [
      {
        label: 'Agendamentos',
        data: data.topLoyalClients.slice(0, 5).map(client => client.appointmentCount),
        backgroundColor: [
          '#F59E0B',
          '#EF4444',
          '#10B981',
          '#3B82F6',
          '#8B5CF6',
        ],
        borderColor: [
          '#D97706',
          '#DC2626',
          '#059669',
          '#2563EB',
          '#7C3AED',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const calculateRetentionRate = () => {
    if (data.totalUniqueClients === 0) return 0;
    return ((data.recurringClients / data.totalUniqueClients) * 100).toFixed(1);
  };

  const calculateGrowthRate = () => {
    // Simulação de crescimento baseado em novos clientes
    const previousMonthClients = Math.max(0, data.totalUniqueClients - data.newClientsThisMonth);
    if (previousMonthClients === 0) return 100;
    return ((data.newClientsThisMonth / previousMonthClients) * 100).toFixed(1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Análise de Clientes
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'loyalty'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Fidelidade
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'growth'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Crescimento
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {data.totalUniqueClients}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Retenção</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {calculateRetentionRate()}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Crescimento</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    +{calculateGrowthRate()}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Distribuição */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Distribuição de Clientes
            </h3>
            <div className="h-64">
              <Doughnut data={clientDistributionData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top 5 Clientes Mais Fiéis
            </h3>
            <div className="h-64">
              <Bar data={topClientsData} options={chartOptions} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cliente Mais Fiel</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {data.topLoyalClients[0]?.clientName || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.topLoyalClients[0]?.appointmentCount || 0} agendamentos
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Recorrentes</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {data.recurringClients}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {calculateRetentionRate()}% do total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Novos Clientes</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {data.newClientsThisMonth}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Este mês</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Crescimento</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    +{calculateGrowthRate()}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">vs mês anterior</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Novos Clientes */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Novos Clientes do Mês
            </h3>
            {data.newClientsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum novo cliente este mês.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.newClientsList.map((client, index) => (
                  <div
                    key={client.clientId || index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {index + 1}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {client.clientName}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(client.firstAppointmentDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
