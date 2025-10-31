import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { TransactionList } from './components/TransactionList';
import { TransferSearch } from './components/TransferSearch';
import { TransactionHistoryReport } from './components/TransactionHistoryReport';
import { APIStatus } from './components/APIStatus';
import { Settings } from './components/Settings';
import { trueWalletService } from './services/trueWalletService';
import type { BalanceData, Transaction } from './types';

type Page = 'dashboard' | 'history' | 'settings';

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

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
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
      <div className="flex border-b border-border">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center text-sm sm:text-base font-medium transition-colors touch-manipulation ${
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
          className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center text-sm sm:text-base font-medium transition-colors touch-manipulation ${
            currentPage === 'history'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <span className="hidden sm:inline">ประวัติรายการรับเงิน</span>
          <span className="sm:hidden">ประวัติ</span>
        </button>
        <button
          onClick={() => setCurrentPage('settings')}
          className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center text-sm sm:text-base font-medium transition-colors touch-manipulation ${
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
        {currentPage === 'settings' && <Settings />}
      </main>

      <footer className="bg-white border-t border-border mt-8 sm:mt-12 py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4 text-center text-muted-foreground text-xs sm:text-sm">
          <p>True Wallet Dashboard - แดชบอร์ดจัดการเงิน</p>
          <p className="mt-1">พัฒนาโดย MiniMax Agent</p>
        </div>
      </footer>
    </div>
  );
}

export default App;