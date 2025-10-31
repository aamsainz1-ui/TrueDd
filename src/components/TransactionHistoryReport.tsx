import React, { useState, useEffect } from 'react';
import { trueWalletService } from '../services/trueWalletService';
import { Download, Calendar, Phone, Search, FileSpreadsheet, TrendingUp } from 'lucide-react';

interface TransactionHistory {
  id: number;
  created_at: string;
  transaction_date: string;
  transaction_time: string;
  phone_number: string;
  amount: number;
  transaction_id: string;
  status: string;
  description: string;
  source_type: string;
}

interface SummaryData {
  totalTransactions: number;
  totalAmount: number;
  dailyTotals: Array<{ date: string; total: number; count: number }>;
}

export function TransactionHistoryReport() {
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    phoneNumber: '',
    limit: 100
  });
  const [showFilters, setShowFilters] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  const fetchTransactionHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching transaction history with filters:', filters);
      const data = await trueWalletService.getTransactionHistory(filters);
      console.log('Received transaction history data:', data);
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (transactions.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    // Prepare data for Excel export
    const excelData = [
      // Header row
      [
        'วันที่',
        'เวลา',
        'เบอร์โทรศัพท์',
        'จำนวนเงิน (บาท)',
        'เลขอ้างอิง',
        'สถานะ',
        'แหล่งข้อมูล',
        'คำอธิบาย'
      ],
      // Data rows
      ...transactions.map(tx => [
        tx.transaction_date,
        tx.transaction_time,
        tx.phone_number,
        tx.amount,
        tx.transaction_id,
        tx.status === 'completed' ? 'สำเร็จ' : tx.status,
        tx.source_type,
        tx.description
      ])
    ];

    // Create CSV content (Excel can open CSV files)
    const csvContent = excelData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transaction_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Excel export completed');
  };

  const applyFilters = () => {
    fetchTransactionHistory();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      phoneNumber: '',
      limit: 100
    });
  };

  const refreshHistory = () => {
    console.log('Refreshing transaction history...');
    fetchTransactionHistory();
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing transaction history...');
      fetchTransactionHistory();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [filters]);

  // Listen for custom events to refresh history
  useEffect(() => {
    const handleRefreshHistory = (event: CustomEvent) => {
      console.log('Received refresh history event:', event.detail);
      setTimeout(() => {
        fetchTransactionHistory();
      }, 500); // Small delay to ensure database is updated
    };

    window.addEventListener('refresh-transaction-history', handleRefreshHistory as EventListener);
    
    return () => {
      window.removeEventListener('refresh-transaction-history', handleRefreshHistory as EventListener);
    };
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">ประวัติรายการรับเงิน</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>กรองข้อมูล</span>
            </button>
            <button
              onClick={refreshHistory}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>↻</span>
              <span>รีเฟรช</span>
            </button>
            <button
              onClick={exportToExcel}
              disabled={transactions.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">ตัวกรองข้อมูล</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  placeholder="เบอร์โทรศัพท์"
                  value={filters.phoneNumber}
                  onChange={(e) => setFilters(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">จำนวนรายการ</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={50}>50 รายการ</option>
                  <option value={100}>100 รายการ</option>
                  <option value={200}>200 รายการ</option>
                  <option value={500}>500 รายการ</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                ค้นหา
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{summary.totalTransactions}</div>
              <div className="text-sm text-muted-foreground">จำนวนรายการทั้งหมด</div>
            </div>
            <div className="bg-success/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-success">฿{formatCurrency(summary.totalAmount)}</div>
              <div className="text-sm text-muted-foreground">ยอดรวมทั้งหมด</div>
            </div>
            <div className="bg-accent/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-accent">
                {summary.dailyTotals.length > 0 ? 
                  new Date(summary.dailyTotals[0].date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : 
                  '-'
                }
              </div>
              <div className="text-sm text-muted-foreground">วันที่มีรายการล่าสุด</div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Totals */}
      {summary && summary.dailyTotals.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">สรุปยอดรับเงินรายวัน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.dailyTotals.slice(0, 6).map((day) => (
              <div key={day.date} className="bg-muted/50 rounded-lg p-4">
                <div className="font-semibold">{new Date(day.date).toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div className="text-lg font-bold text-success">฿{formatCurrency(day.total)}</div>
                <div className="text-sm text-muted-foreground">{day.count} รายการ</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">รายการรับเงินทั้งหมด</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <button
              onClick={fetchTransactionHistory}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            ไม่พบข้อมูลประวัติรายการรับเงิน
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-success/10 text-success">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{transaction.phone_number}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateTime(transaction.transaction_date, transaction.transaction_time)}</span>
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      เลขอ้างอิง: {transaction.transaction_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-success">
                    +฿{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-success">สำเร็จ</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}