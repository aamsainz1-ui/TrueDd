import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface APIStatusProps {
  balanceStatus: 'success' | 'error' | 'loading';
  transactionsStatus: 'success' | 'error' | 'loading';
  lastUpdate?: string;
}

export function APIStatus({ balanceStatus, transactionsStatus, lastUpdate }: APIStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'loading':
        return <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'เชื่อมต่อสำเร็จ';
      case 'error':
        return 'การเชื่อมต่อล้มเหลว';
      case 'loading':
        return 'กำลังเชื่อมต่อ';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'loading':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">สถานะการเชื่อมต่อ API</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
          {getStatusIcon(balanceStatus)}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Balance API</p>
            <p className={`text-sm font-medium ${getStatusColor(balanceStatus)}`}>
              {getStatusText(balanceStatus)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
          {getStatusIcon(transactionsStatus)}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Transactions API</p>
            <p className={`text-sm font-medium ${getStatusColor(transactionsStatus)}`}>
              {getStatusText(transactionsStatus)}
            </p>
          </div>
        </div>
      </div>

      {lastUpdate && (
        <div className="flex items-center justify-center space-x-1 mt-3 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>อัปเดตล่าสุด: {new Date(lastUpdate).toLocaleTimeString('th-TH')}</span>
        </div>
      )}
    </div>
  );
}
