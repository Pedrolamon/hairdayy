import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/use-auth';
import { 
  Users, 
  DollarSign, 
  Gift, 
  TrendingUp, 
  Copy, 
  Check,
  UserPlus,
  CreditCard
} from 'lucide-react';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  currentDiscount: number;
  currentPayout: number;
  totalPayouts: number;
  pendingPayouts: number;
  referrals: Array<{
    id: string;
    active: boolean;
    createdAt: string;
    referee: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      subscription: {
        status: string;
        price: number;
      } | null;
    };
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAt: string | null;
    note: string | null;
  }>;
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      const response = await api.get('/referral/my-referrals');
      setReferralData(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados de indicação:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (referralData?.referralCode) {
      try {
        await navigator.clipboard.writeText(referralData.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar código:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <p className="text-gray-500 dark:text-gray-400">Error loading referral data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-blue-500" />
          Referral System
        </h2>
        <button
          onClick={copyReferralCode}
          className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition flex items-center gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      {/* Código de Indicação */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your referral code:</p>
            <p className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-100">
              {referralData.referralCode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Share and win</p>
            <p className="text-lg font-bold text-green-600">R$ 10 per referral!</p>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {referralData.totalReferrals}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Indications</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {referralData.activeReferrals}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Discount</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                R$ {referralData.currentDiscount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receivable</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                R$ {referralData.currentPayout}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo de Pagamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Received</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                R$ {referralData.totalPayouts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payment</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                R$ {referralData.pendingPayouts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
          Como Funciona o Sistema de Indicações
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• <strong>1ª indication:</strong> R$ 10 discount on your monthly fee</p>
          <p>• <strong>2ª indication:</strong> R$ 20 discount on your monthly fee</p>
          <p>• <strong>3ª indication:</strong> R$ 30 discount (free monthly fee!)</p>
          <p>• <strong>4ª indication onwards:</strong> R$ 10 by referral via PIX</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            * Discounts are applied automatically. Payments via PIX are processed monthly.
          </p>
        </div>
      </div>
    </div>
  );
}
