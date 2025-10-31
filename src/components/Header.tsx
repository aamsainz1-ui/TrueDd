import { Wallet, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  currentTime: string;
}

export function Header({ onRefresh, isLoading, currentTime }: HeaderProps) {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">True Wallet</h1>
              <p className="text-xs sm:text-sm text-white/80 truncate">แดชบอร์ดจัดการเงิน</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="text-right hidden md:block">
              <div className="text-xs sm:text-sm font-medium whitespace-nowrap">{currentTime}</div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
              aria-label="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-sm">รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
