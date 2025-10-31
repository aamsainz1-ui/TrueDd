import { Wallet } from 'lucide-react';
import type { BalanceData } from '../types';

interface BalanceCardProps {
  balance: BalanceData | null;
  isLoading: boolean;
  error: string | null;
}

export function BalanceCard({ balance, isLoading, error }: BalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-primary via-primary-light to-primary-dark text-white rounded-2xl shadow-xl p-8 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wallet className="w-6 h-6" />
          <span className="text-lg font-medium">ยอดเงินคงเหลือ</span>
        </div>
        {balance?.timestamp && (
          <span className="text-xs text-white/70">
            อัปเดต: {new Date(balance.timestamp).toLocaleTimeString('th-TH')}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse-glow">
            <div className="h-12 w-48 bg-white/20 rounded-lg"></div>
          </div>
        </div>
      ) : error ? (
        <div className="py-4">
          <p className="text-red-200 text-sm">ข้อผิดพลาด: {error}</p>
          <p className="text-white/60 text-xs mt-1">กรุณาลองใหม่อีกครั้ง</p>
        </div>
      ) : (
        <div>
          <div className="text-5xl font-bold mb-2">
            ฿{balance ? formatCurrency(balance.currentBalance) : '0.00'}
          </div>
          <div className="text-lg text-white/80">
            บาท (Baht)
          </div>
        </div>
      )}
    </div>
  );
}
