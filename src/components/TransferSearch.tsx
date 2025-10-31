import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { TransferHistory } from '../types';
import { TransferHistoryList } from './TransferHistoryList';

interface TransferSearchProps {
  onSearch: (phoneNumber: string, amount?: number) => Promise<TransferHistory[]>;
}

export function TransferSearch({ onSearch }: TransferSearchProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<TransferHistory[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ไม่ต้องเช็คเงื่อนไข สามารถค้นหาได้แม้ไม่มีเบอร์หรือเงิน
    if (!phoneNumber.trim() && !amount.trim()) {
      // ถ้าไม่ใส่ทั้งเบอร์และเงิน ให้ใช้ค่า default
      setError('กรุณาใส่เบอร์โทรศัพท์หรือจำนวนเงินอย่างน้อย 1 รายการ');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const amountValue = amount.trim() ? parseFloat(amount) : undefined;
      const results = await onSearch(phoneNumber, amountValue);
      setTransfers(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถค้นหาข้อมูลได้';
      setError(errorMessage);
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove non-numeric characters
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 10);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">ค้นหาประวัติการรับโอนเงิน</h2>
      <p className="text-sm text-muted-foreground mb-4">
        สามารถค้นหาได้โดยใส่เบอร์โทรศัพท์, จำนวนเงิน หรือทั้งสองอย่าง
      </p>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="ใส่เบอร์โทรศัพท์ (เช่น 0812345678)"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={10}
                disabled={isLoading}
              />
            </div>
            <div className="w-32">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="จำนวนเงิน"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังค้นหา</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>ค้นหาประวัติการรับโอนเงิน</span>
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </form>

      {hasSearched && !isLoading && (
        <div className="mt-4">
          {transfers.length > 0 ? (
            <TransferHistoryList transfers={transfers} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบข้อมูลการรับโอนเงินจากเบอร์นี้
            </div>
          )}
        </div>
      )}
    </div>
  );
}
