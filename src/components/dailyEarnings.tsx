import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from "../hooks/use-auth";
import { DollarSign, CalendarClock, CalendarDays, BarChart, AlertCircle } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function AgendaInfoCards() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dailyCount, setDailyCount] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);

  const [dailyProfit, setDailyProfit] = useState(0);
  const [weeklyProfit, setWeeklyProfit] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    console.log("Iniciando a busca por dados do dashboard...");
    
    try {
        console.log("Chamando a API de lucro para o período 'day'...");
      const dailyCountRes = await api.get('/appointments/count', { params: { period: 'day' } });
      const weeklyCountRes = await api.get('/appointments/count', { params: { period: 'week' } });
      const monthlyCountRes = await api.get('/appointments/count', { params: { period: 'month' } });

      const dailyProfitRes = await api.get('/appointments/profit', { params: { period: 'day' } });
      const weeklyProfitRes = await api.get('/appointments/profit', { params: { period: 'week' } });
      const monthlyProfitRes = await api.get('/appointments/profit', { params: { period: 'month' } });

      setDailyCount(dailyCountRes.data.count);
      setWeeklyCount(weeklyCountRes.data.count);
      setMonthlyCount(monthlyCountRes.data.count);
      
      setDailyProfit(dailyProfitRes.data.totalProfit);
      setWeeklyProfit(weeklyProfitRes.data.totalProfit);
      setMonthlyProfit(monthlyProfitRes.data.totalProfit);

    } catch (e: any) {
         console.error("Erro na busca de dados:", e.message);
      console.error("Erro ao buscar dados do dashboard:", e);
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!user || loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
   return (
      <div className="flex flex-col space-y-6">
        {/* Carregamento para Agendamentos (com flex) */}
        <div className="flex flex-col md:flex-row gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={`count-${i}`} className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center gap-4">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Carregamento para Lucro (com flex) */}
        <div className="flex flex-col md:flex-row gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={`profit-${i}`} className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center gap-4">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-8">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Seção de Agendamentos */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 flex items-center gap-4">
          <CalendarClock className="text-blue-600 h-8 w-8"/>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{dailyCount}</h3>
            <p className="text-sm text-gray-600">Appointments Today</p>
          </div>
        </div>
        <div className="flex-1 bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 flex items-center gap-4">
          <CalendarDays className="text-blue-600 h-8 w-8"/>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{weeklyCount}</h3>
            <p className="text-sm text-gray-600">Weekly Appointments</p>
          </div>
        </div>
        <div className="flex-1 bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 flex items-center gap-4">
          <BarChart className="text-blue-600 h-8 w-8"/>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{monthlyCount}</h3>
            <p className="text-sm text-gray-600">Monthly Appointments</p>
          </div>
        </div>
      </div>

      {/* Seção de Ganhos */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-green-50 p-6 rounded-lg shadow-sm border border-green-200 flex items-center gap-4">
          <DollarSign className="text-green-600 h-8 w-8"/>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{formatCurrency(dailyProfit)}</h3>
            <p className="text-sm text-gray-600">Profit Today</p>
          </div>
        </div>
        <div className="flex-1 bg-green-50 p-6 rounded-lg shadow-sm border border-green-200 flex items-center gap-4">
          <DollarSign className="text-green-600 h-8 w-8"/>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{formatCurrency(weeklyProfit)}</h3>
            <p className="text-sm text-gray-600">Weekly Profit</p>
          </div>
        </div>
        <div className="flex-1 bg-green-50 p-6 rounded-lg shadow-sm border border-green-200 flex items-center gap-4">
          <DollarSign className="text-green-600 h-8 w-8"/>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{formatCurrency(monthlyProfit)}</h3>
            <p className="text-sm text-gray-600">Monthly Profit</p>
          </div>
        </div>
      </div>
    </div>
  );
}