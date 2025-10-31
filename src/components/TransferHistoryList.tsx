import { User, Clock, CheckCircle2, AlertCircle, ArrowRight, Receipt } from 'lucide-react';
import type { TransferHistory } from '../types';

interface TransferHistoryListProps {
  transfers: TransferHistory[];
}

export function TransferHistoryList({ transfers }: TransferHistoryListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.round(amount * 100) / 100); // ปัดเศษและบังคับแสดง 2 ตำแหน่ง
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  if (transfers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-2">
        พบ {transfers.length} รายการ
      </div>
      {transfers.map((transfer, index) => (
        <div
          key={transfer.id}
          className="bg-white rounded-lg border border-border hover:shadow-md transition-shadow p-4"
        >
          {/* Header - ผู้ส่ง ผู้รับ และจำนวนเงิน */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{transfer.fromName}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm text-muted-foreground">{transfer.toName || 'ไม่ระบุ'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-success">
                +฿{formatCurrency(transfer.amount)}
              </p>
              {transfer.originalAmount && (
                <p className="text-xs text-muted-foreground">
                  ({transfer.originalAmount.toLocaleString()} สตางค์)
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>เวลาที่รับเงิน:</span>
              </div>
              <span>{formatDateTime(transfer.datetime)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Receipt className="w-3 h-3" />
                <span>เวลาที่ค้นหา:</span>
              </div>
              <span>{transfer.searchTime ? formatDateTime(transfer.searchTime) : 'ไม่ระบุ'}</span>
            </div>

            {transfer.reference && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Receipt className="w-3 h-3" />
                  <span>เลขอ้างอิง:</span>
                </div>
                <span className="font-mono text-xs">{transfer.reference}</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-end mt-3 pt-2 border-t border-border">
            <div className="flex items-center space-x-1 text-xs">
              {transfer.status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  <span className="text-success">สำเร็จ</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-accent" />
                  <span className="text-accent">รอดำเนินการ</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}