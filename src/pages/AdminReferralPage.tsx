import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/use-auth';
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  CreditCard,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  note: string | null;
  referrer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

interface PayoutSummary {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
}

export default function AdminReferralPage() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPayouts();
    }
  }, [user]);

  const fetchPayouts = async () => {
    try {
      const response = await api.get('/referral/admin/payouts');
      setPayouts(response.data.payouts);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutStatus = async (payoutId: string, status: string, note?: string) => {
    setUpdating(payoutId);
    try {
      await api.patch(`/referral/payout/${payoutId}`, { status, note });
      await fetchPayouts(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
    } finally {
      setUpdating(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="text-red-500 font-semibold">
          Acesso negado. Apenas administradores podem acessar esta página.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Gestão de Pagamentos por Indicação
        </h1>

        {/* Resumo */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total de Pagamentos</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Pagos</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.paid}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Valor Pendente</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(summary.totalPendingAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Pagamentos */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Lista de Pagamentos</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Observações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payout.referrer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payout.referrer.email}
                          </div>
                          {payout.referrer.phone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {payout.referrer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(payout.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                        {getStatusIcon(payout.status)}
                        {payout.status === 'PENDING' ? 'Pendente' : 
                         payout.status === 'PAID' ? 'Pago' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(payout.createdAt)}
                      </div>
                      {payout.paidAt && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Pago em: {formatDate(payout.paidAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payout.note || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {payout.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updatePayoutStatus(payout.id, 'PAID', 'Pagamento realizado via PIX')}
                            disabled={updating === payout.id}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <CreditCard className="h-4 w-4" />
                            {updating === payout.id ? 'Processando...' : 'Marcar como Pago'}
                          </button>
                          <button
                            onClick={() => updatePayoutStatus(payout.id, 'CANCELLED', 'Pagamento cancelado')}
                            disabled={updating === payout.id}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancelar
                          </button>
                        </div>
                      )}
                      {payout.status === 'PAID' && (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Pago
                        </span>
                      )}
                      {payout.status === 'CANCELLED' && (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          Cancelado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payouts.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum pagamento encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
