import { ArrowDownLeft, ArrowUpRight, Clock, Loader2 } from 'lucide-react';
import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionList({ transactions, isLoading = false }: TransactionListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === today.toDateString()) {
      return `วันนี้ ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `เมื่อวาน ${timeStr}`;
    }
    return `${dateStr} ${timeStr}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'pending':
        return 'text-accent';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'สำเร็จ';
      case 'pending':
        return 'รอดำเนินการ';
      case 'failed':
        return 'ล้มเหลว';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">รายการล่าสุด</h2>
      
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            ไม่มีรายการธุรกรรม
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === 'income'
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {transaction.type === 'income' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{transaction.category}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(transaction.datetime)}</span>
                  </div>
                  {transaction.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {transaction.description}
                    </p>
                  )}
                  {(transaction.sender || transaction.recipient) && (
                    <p className="text-xs text-muted-foreground">
                      {transaction.sender ? `จาก: ${transaction.sender}` : `ถึง: ${transaction.recipient}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold text-lg ${
                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}฿
                  {formatCurrency(transaction.amount)}
                </p>
                <p className={`text-xs ${getStatusColor(transaction.status)}`}>
                  {getStatusText(transaction.status)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
