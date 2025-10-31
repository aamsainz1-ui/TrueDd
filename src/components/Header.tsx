import { Wallet, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  currentTime: string;
}

export function Header({ onRefresh, isLoading, currentTime }: HeaderProps) {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">True Wallet</h1>
              <p className="text-sm text-white/80">แดชบอร์ดจัดการเงิน</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">{currentTime}</div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
