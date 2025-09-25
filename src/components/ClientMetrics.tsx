import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Repeat, 
  Trophy, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';

interface ClientMetricsData {
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
}

interface ClientMetricsProps {
  data: ClientMetricsData;
}

export default function ClientMetrics({ data }: ClientMetricsProps) {
  const [showTopClients, setShowTopClients] = useState(false);
  const [showNewClients, setShowNewClients] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}º`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Customer Metrics
        </h2>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {data.totalUniqueClients}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">New this month</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {data.newClientsThisMonth}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Repeat className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recurring Customers</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {data.recurringClients}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clientes Mais Fiéis */}
      <div className="mb-6">
        <button
          onClick={() => setShowTopClients(!showTopClients)}
          className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Top Most Loyal Customers
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.topLoyalClients.length} Customers with more than 1 appointment
              </p>
            </div>
          </div>
          {showTopClients ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showTopClients && (
          <div className="mt-4 space-y-2">
            {data.topLoyalClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No returning customers found in the selectd period.</p>
              </div>
            ) : (
              data.topLoyalClients.map((client, index) => (
                <div
                  key={client.clientId || index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {getRankingIcon(index)}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {client.clientName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {client.appointmentCount} Appointments{client.appointmentCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {client.appointmentCount}x
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Novos Clientes do Mês */}
      <div>
        <button
          onClick={() => setShowNewClients(!showNewClients)}
          className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-green-500" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                New Customers of the Month
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.newClientsList.length} New customers of the Month
              </p>
            </div>
          </div>
          {showNewClients ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showNewClients && (
          <div className="mt-4 space-y-2">
            {data.newClientsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No new customers this month.</p>
              </div>
            ) : (
              data.newClientsList.map((client, index) => (
                <div
                  key={client.clientId || index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {client.clientName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        First appointment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    {formatDate(client.firstAppointmentDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
          💡 Customer Insights
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          {data.recurringClients > 0 && (
            <p>• {((data.recurringClients / data.totalUniqueClients) * 100).toFixed(1)}% of your customers are recurring</p>
          )}
          {data.newClientsThisMonth > 0 && (
            <p>• You conquered {data.newClientsThisMonth} novo{data.newClientsThisMonth > 1 ? 's' : ''} cliente{data.newClientsThisMonth > 1 ? 's' : ''} this month</p>
          )}
          {data.topLoyalClients.length > 0 && (
            <p>• your most loyal customer has {data.topLoyalClients[0]?.appointmentCount} appointment</p>
          )}
        </div>
      </div>
    </div>
  );
}
