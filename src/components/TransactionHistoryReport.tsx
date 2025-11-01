import React, { useState, useEffect } from 'react';
import { trueWalletService } from '../services/trueWalletService';
import { ClearHistoryButton } from './ClearHistoryButton';
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const formatCurrency = (amount: number) => {
    // แปลงเป็นจำนวนเต็มถ้าไม่มีทศนิยม
    const roundedAmount = Math.round(amount);
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedAmount);
  };

  // ค้นหายอดรวมของวันนี้
  const getTodayTotal = (dailyTotals: Array<{ date: string; total: number; count: number }>) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayData = dailyTotals.find(day => day.date === today);
    return todayData ? todayData.total : 0;
  };

  // ค้นหายอดรวมของวันล่าสุด
  const getLatestDayTotal = (dailyTotals: Array<{ date: string; total: number; count: number }>) => {
    if (dailyTotals.length === 0) return 0;
    return dailyTotals[0].total; // วันที่มีรายการล่าสุด (เรียงจากใหม่ไปเก่า)
  };

  // คำนวณยอดรวมของเดือนปัจจุบัน (พฤศจิกายน 2025)
  const getCurrentMonthTotal = (dailyTotals: Array<{ date: string; total: number; count: number }>) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    let total = 0;
    let count = 0;
    
    dailyTotals.forEach(day => {
      const dayDate = new Date(day.date);
      if (dayDate.getFullYear() === currentYear && dayDate.getMonth() === currentMonth) {
        total += day.total;
        count += day.count;
      }
    });

    return { total, count };
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
      setLastUpdate(new Date());
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
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">ประวัติรายการรับเงิน</h1>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-xs sm:text-sm whitespace-nowrap min-h-[36px] sm:min-h-[40px] touch-manipulation"
            >
              <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>กรองข้อมูล</span>
            </button>
            <button
              onClick={refreshHistory}
              disabled={isLoading}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm whitespace-nowrap min-h-[36px] sm:min-h-[40px] touch-manipulation"
            >
              <span className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`}>↻</span>
              <span>รีเฟรช</span>
            </button>
            <ClearHistoryButton 
              searchTerm={filters.phoneNumber || undefined}
              onClear={() => {
                console.log('History cleared, refreshing...');
                setTimeout(() => {
                  fetchTransactionHistory();
                }, 1000);
              }}
            />
            <button
              onClick={exportToExcel}
              disabled={transactions.length === 0}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm whitespace-nowrap min-h-[36px] sm:min-h-[40px] touch-manipulation"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
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
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-muted-foreground">
                อัปเดต: {lastUpdate.toLocaleTimeString('th-TH', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-primary/10 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-primary">{summary.totalTransactions}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">จำนวนรายการทั้งหมด</div>
              </div>
              <div className="bg-success/10 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-success">฿{formatCurrency(getLatestDayTotal(summary.dailyTotals))}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">ยอดรวมวันล่าสุด</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  ฿{formatCurrency(getCurrentMonthTotal(summary.dailyTotals).total)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  ยอดรวมเดือนนี้ ({getCurrentMonthTotal(summary.dailyTotals).count} รายการ)
                </div>
              </div>
              <div className="bg-accent/10 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-accent">
                  {summary.dailyTotals.length > 0 ? 
                    new Date(summary.dailyTotals[0].date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : 
                    '-'
                  }
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">วันที่มีรายการล่าสุด</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Daily Totals */}
      {summary && summary.dailyTotals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
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

      {/* Transaction List - Card Layout with Gray Background */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">รายการรับเงินทั้งหมด</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive text-sm sm:text-base">{error}</p>
            <button
              onClick={fetchTransactionHistory}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm sm:text-base"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
            ไม่พบข้อมูลประวัติรายการรับเงิน
          </div>
        ) : (
          <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto custom-scrollbar-green space-y-3 sm:space-y-4 pr-1">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left side - Icon and Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Phone Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    
                    {/* Transaction Details */}
                    <div className="min-w-0 flex-1">
                      {/* Phone Number / Title */}
                      <p className="font-bold text-gray-900 text-base sm:text-lg mb-1">
                        {transaction.phone_number}
                      </p>
                      
                      {/* Date and Time */}
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatDateTime(transaction.transaction_date, transaction.transaction_time)}</span>
                      </div>
                      
                      {/* Description */}
                      {transaction.description && (
                        <p className="text-sm text-gray-700 mb-1">
                          {transaction.description}
                        </p>
                      )}
                      
                      {/* Reference Code */}
                      <p className="text-sm text-gray-600">
                        เลขอ้างอิง: {transaction.transaction_id}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side - Amount and Status */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xl sm:text-2xl text-green-600 mb-1">
                      +฿{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">สำเร็จ</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}