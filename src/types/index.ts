export interface BalanceData {
  currentBalance: number;
  currency: string;
  timestamp?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  recipient?: string;
  sender?: string;
  datetime: string;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
}

// API Response types - ตามโครงสร้างจริงของ True Wallet API
export interface TransferSearchResponse {
  status: string; // "ok" or "err"
  data: {
    system_code: number; // 1000, 2001, etc.
    transactions: TransferTransaction[];
  };
}

export interface TransferTransaction {
  event_type: string; // "P2P", etc.
  amount: number; // จำนวนเงินในหน่วยสตางค์
  sender_mobile: string; // เบอร์โทรศัพท์ผู้ส่ง
  receiver_mobile: string; // เบอร์โทรศัพท์ผู้รับ
  received_time: string; // "YYYY-MM-DD HH:mm:ss"
  transaction_id: string; // เลขอ้างอิงธุรกรรม
}

export interface TransferHistory {
  id: string;
  fromName: string; // ใช้เบอร์โทรศัพท์แทนชื่อ
  toName?: string; // ใช้เบอร์โทรศัพท์แทนชื่อ
  amount: number; // จำนวนเงินในหน่วยบาท
  originalAmount?: number; // จำนวนสตางค์ต้นฉบับ
  datetime: string; // เวลาที่รับเงิน
  searchTime?: string; // เวลาที่ค้นหา
  status: 'completed' | 'pending';
  reference?: string; // transaction_id
  eventType?: string; // event_type จาก API
}
