import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement);

const BarberDashboard: React.FC = () => {
  const { token } = useAuth();
  const { unit } = useUnit();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ start: string; end: string; barberId: string }>({ start: '', end: '', barberId: '' });
  const [barbers, setBarbers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/barbers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setBarbers);
  }, [token]);

  const fetchDashboard = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.start) params.append('start', filters.start);
    if (filters.end) params.append('end', filters.end);
    if (filters.barberId) params.append('barberId', filters.barberId);
    if (unit?.id) params.append('unitId', String(unit.id));
    fetch('/api/dashboard?' + params.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, [token, filters]);

  if (loading) return <div>Carregando dashboard...</div>;
  if (!data) return <div>Erro ao carregar dashboard.</div>;

  // Dados para gráficos
  const days = Object.keys(data.appointmentsByDay).sort();
  const appointmentsPerDay = days.map(d => data.appointmentsByDay[d]);
  const salesDays = Object.keys(data.salesByDay).sort();
  const salesPerDay = salesDays.map(d => data.salesByDay[d]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <form className="flex flex-wrap gap-2 mb-6 items-end">
        <label className="flex flex-col">
          <span className="text-xs">Data inicial</span>
          <input type="date" value={filters.start} onChange={e => setFilters(f => ({ ...f, start: e.target.value }))} className="border p-1" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs">Data final</span>
          <input type="date" value={filters.end} onChange={e => setFilters(f => ({ ...f, end: e.target.value }))} className="border p-1" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs">Barbeiro</span>
          <select value={filters.barberId} onChange={e => setFilters(f => ({ ...f, barberId: e.target.value }))} className="border p-1">
            <option value="">Todos</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <button type="button" className="bg-blue-600 text-white px-2 py-1 rounded" onClick={fetchDashboard}>Filtrar</button>
        <button type="button" className="ml-2 px-2 py-1" onClick={() => setFilters({ start: '', end: '', barberId: '' })}>Limpar</button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded text-center">
          <div className="text-2xl font-bold">{data.totalAppointments}</div>
          <div className="text-gray-600">Agendamentos</div>
        </div>
        <div className="bg-green-100 p-4 rounded text-center">
          <div className="text-2xl font-bold">{data.totalSales}</div>
          <div className="text-gray-600">Vendas</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded text-center">
          <div className="text-2xl font-bold">{data.totalProductsSold}</div>
          <div className="text-gray-600">Produtos Vendidos</div>
        </div>
        <div className="bg-purple-100 p-4 rounded text-center">
          <div className="text-2xl font-bold">R$ {Number(data.totalRevenue).toFixed(2)}</div>
          <div className="text-gray-600">Faturamento</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold mb-2">Agendamentos por Dia</h3>
          <Line data={{
            labels: days,
            datasets: [{ label: 'Agendamentos', data: appointmentsPerDay, borderColor: '#2563eb', backgroundColor: '#93c5fd' }],
          }} />
        </div>
        <div>
          <h3 className="font-bold mb-2">Vendas por Dia</h3>
          <Bar data={{
            labels: salesDays,
            datasets: [{ label: 'Vendas', data: salesPerDay, backgroundColor: '#22c55e' }],
          }} />
        </div>
        <div>
          <h3 className="font-bold mb-2">Top Serviços</h3>
          <Pie data={{
            labels: data.topServices.map((s: any) => s[0]),
            datasets: [{ data: data.topServices.map((s: any) => s[1]), backgroundColor: ['#2563eb', '#22c55e', '#f59e42', '#a78bfa', '#f43f5e'] }],
          }} />
        </div>
        <div>
          <h3 className="font-bold mb-2">Top Barbeiros</h3>
          <Pie data={{
            labels: data.topBarbers.map((b: any) => b[0]),
            datasets: [{ data: data.topBarbers.map((b: any) => b[1]), backgroundColor: ['#a78bfa', '#f59e42', '#2563eb', '#22c55e', '#f43f5e'] }],
          }} />
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard; 