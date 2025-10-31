import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { TransactionList } from './components/TransactionList';
import { TransferSearch } from './components/TransferSearch';
import { TransactionHistoryReport } from './components/TransactionHistoryReport';
import { APIStatus } from './components/APIStatus';
import { Settings } from './components/Settings';
import { DailyExportSettings } from './components/DailyExportSettings';
import { BalanceTrendChart } from './components/BalanceTrendChart';
import { trueWalletService } from './services/trueWalletService';
import type { BalanceData, Transaction } from './types';

type Page = 'dashboard' | 'history' | 'export' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const [balanceStatus, setBalanceStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [transactionsStatus, setTransactionsStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [isUpdatingFromConfig, setIsUpdatingFromConfig] = useState(false);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    setBalanceError(null);
    setBalanceStatus('loading');
    
    try {
      const data = await trueWalletService.fetchBalance();
      setBalance(data);
      setBalanceStatus('success');
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลยอดเงินได้';
      setBalanceError(errorMessage);
      setBalanceStatus('error');
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    setTransactionsError(null);
    setTransactionsStatus('loading');
    
    try {
      const data = await trueWalletService.fetchRecentTransactions();
      setTransactions(data);
      setTransactionsStatus('success');
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลธุรกรรมได้';
      setTransactionsError(errorMessage);
      setTransactionsStatus('error');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchBalance(), fetchTransactions()]);
  };

  useEffect(() => {
    fetchAllData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    // Update current time every second
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const dateString = now.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setCurrentTime(`${dateString} เวลา ${timeString}`);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Listen for config updates from Settings
    const handleConfigUpdate = () => {
      console.log('Config updated, refreshing data...');
      setIsUpdatingFromConfig(true);
      toast.success('อัปเดตการตั้งค่าแล้ว กำลังรีเฟรชข้อมูล...');
      
      // Small delay to show updating status
      setTimeout(() => {
        fetchAllData().finally(() => {
          setIsUpdatingFromConfig(false);
          toast.success('อัปเดตข้อมูลสำเร็จ!');
        });
      }, 500);
    };

    window.addEventListener('api-config-updated', handleConfigUpdate);
    window.addEventListener('configUpdated', handleConfigUpdate);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      window.removeEventListener('api-config-updated', handleConfigUpdate);
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, []);

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleTransferSearch = async (phoneNumber: string, amount?: number) => {
    return await trueWalletService.searchTransfersByPhone(phoneNumber, amount);
  };

  const isLoading = isLoadingBalance || isLoadingTransactions;

  // Render dashboard content
  const renderDashboard = () => (
    <div className="max-w-4xl mx-auto">
      {isUpdatingFromConfig && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-800 font-medium">กำลังอัปเดตข้อมูลจากการตั้งค่าใหม่...</span>
          </div>
        </div>
      )}
      
      <APIStatus 
        balanceStatus={balanceStatus}
        transactionsStatus={transactionsStatus}
        lastUpdate={lastUpdate || undefined}
      />

      <BalanceCard 
        balance={balance} 
        isLoading={isLoadingBalance} 
        error={balanceError} 
      />

      {/* เพิ่มกราฟแนวโน้มยอดรับเงินรายวัน */}
      <BalanceTrendChart />
      
      <div className="grid md:grid-cols-1 gap-6">
        <div>
          {transactionsError ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">รายการล่าสุด</h2>
              <div className="text-center py-8">
                <p className="text-destructive text-sm">ข้อผิดพลาด: {transactionsError}</p>
                <p className="text-muted-foreground text-xs mt-1">กรุณาลองใหม่อีกครั้ง</p>
              </div>
            </div>
          ) : (
            <TransactionList transactions={transactions} isLoading={isLoadingTransactions} />
          )}
        </div>

        <TransferSearch onSearch={handleTransferSearch} />
      </div>
    </div>
  );

  // Render navigation tabs
  const renderNavigation = () => (
    <div className="bg-white rounded-xl shadow-md mb-4 sm:mb-6">
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center text-xs sm:text-sm md:text-base font-medium transition-colors touch-manipulation whitespace-nowrap ${
            currentPage === 'dashboard'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <span className="hidden sm:inline">แดชบอร์ดหลัก</span>
          <span className="sm:hidden">หน้าหลัก</span>
        </button>
        <button
          onClick={() => setCurrentPage('history')}
          className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center text-xs sm:text-sm md:text-base font-medium transition-colors touch-manipulation whitespace-nowrap ${
            currentPage === 'history'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <span className="hidden sm:inline">ประวัติรายการรับเงิน</span>
          <span className="sm:hidden">ประวัติ</span>
        </button>
        <button
          onClick={() => setCurrentPage('export')}
          className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center text-xs sm:text-sm md:text-base font-medium transition-colors touch-manipulation whitespace-nowrap ${
            currentPage === 'export'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <span className="hidden sm:inline">ส่งออกข้อมูล</span>
          <span className="sm:hidden">ส่งออก</span>
        </button>
        <button
          onClick={() => setCurrentPage('settings')}
          className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center text-xs sm:text-sm md:text-base font-medium transition-colors touch-manipulation whitespace-nowrap ${
            currentPage === 'settings'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          การตั้งค่า
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onRefresh={handleRefresh} isLoading={isLoading} currentTime={currentTime} />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {renderNavigation()}
        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'history' && <TransactionHistoryReport />}
        {currentPage === 'export' && <DailyExportSettings />}
        {currentPage === 'settings' && <Settings />}
      </main>

      <footer className="bg-white border-t border-border mt-8 sm:mt-12 py-3 sm:py-4">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center text-muted-foreground text-xs">
            <p className="font-medium">True Wallet Dashboard</p>
            <p className="mt-0.5 opacity-70">จัดการเงินอย่างมีประสิทธิภาพ</p>
            <p className="mt-1 text-[10px] sm:text-xs opacity-50">พัฒนาโดย MiniMax Agent</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;