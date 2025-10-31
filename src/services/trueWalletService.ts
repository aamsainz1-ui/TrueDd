import type { BalanceData, Transaction, TransferHistory } from '../types';

// Supabase configuration
const SUPABASE_URL = 'https://kmloseczqatswwczqajs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I';

export class TrueWalletService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = SUPABASE_URL;
    this.supabaseKey = SUPABASE_ANON_KEY;
  }

  async fetchBalance(): Promise<BalanceData> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/true-wallet-balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // API returns: { data: { balance: "3844009", mobile_no: "...", updated_at: "..." } }
      const apiData = result.data?.data || result.data;
      
      return {
        currentBalance: parseFloat(apiData.balance || 0) / 100, // แปลงจากสตางค์เป็นบาท
        currency: 'THB',
        timestamp: result.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw error;
    }
  }

  async fetchRecentTransactions(): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/true-wallet-transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // API returns single transaction: { event_type, amount, sender_mobile, receiver_mobile, received_time, transaction_id, message }
      const apiData = result.data?.data || result.data;
      
      // Convert single transaction to array
      const transactions = Array.isArray(apiData) ? apiData : [apiData];
      
      const processedTransactions = transactions.map((item: any, index: number) => {
        const amountValue = parseFloat(item.amount || 0) / 100.0; // แปลงจากสตางค์เป็นบาท (ใช้ 100.0 เพื่อให้เป็น float division)
        
        const transaction = {
          id: item.transaction_id || `TXN${String(index + 1).padStart(3, '0')}`,
          type: 'income' as const,
          category: item.event_type === 'P2P' ? 'รับโอนเงิน' : 'รายการอื่น',
          amount: amountValue,
          sender: item.sender_mobile || 'ไม่ระบุ',
          datetime: item.received_time || new Date().toISOString(),
          status: 'completed' as const,
          description: item.message || ''
        };

        // Auto-save transaction history for each recent transaction
        this.saveTransactionHistory({
          phoneNumber: item.sender_mobile || '',
          amount: amountValue,
          transactionId: item.transaction_id || `TXN${String(index + 1).padStart(3, '0')}`,
          transactionTime: item.received_time || new Date().toISOString(),
          description: `รับเงินรายการล่าสุด - ${item.event_type === 'P2P' ? 'รับโอนเงิน' : 'รายการอื่น'}`,
          sourceType: 'recent_transactions'
        }).catch(error => {
          console.error('Failed to auto-save recent transaction history:', error);
        });

        return transaction;
      });

      return processedTransactions;
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
      throw error;
    }
  }

  async searchTransfersByPhone(phoneNumber: string, amount?: number): Promise<TransferHistory[]> {
    try {
      const requestBody: any = { phoneNumber };
      if (amount !== undefined && amount > 0) {
        requestBody.amount = Math.round(amount * 100); // แปลงจากบาทเป็นสตางค์
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/true-wallet-transfer-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // ใช้โครงสร้าง API จริง: {status, data: {system_code, transactions}}
      const apiData = result.data || result;
      console.log('Full API response structure:', {
        result: result,
        apiData: apiData,
        data: result.data,
        dataProperty: result.data?.data
      });
      
      // ตรวจสอบ status
      if (apiData.status === 'err') {
        throw new Error(apiData.data?.err || apiData.err || 'ไม่พบข้อมูลการโอนเงิน');
      }
      
      // ตรวจสอบ system_code และ transactions - ลองหลายรูปแบบ
      let transactions = null;
      
      // รูปแบบ 1: apiData.data.transactions
      if (apiData.status === 'ok' && apiData.data?.transactions) {
        transactions = apiData.data.transactions;
        console.log('Found transactions in apiData.data.transactions:', transactions.length);
      }
      // รูปแบบ 2: apiData.transactions (ถ้าไม่ได้ในรูปแบบแรก)
      else if (apiData.status === 'ok' && apiData.transactions) {
        transactions = apiData.transactions;
        console.log('Found transactions in apiData.transactions:', transactions.length);
      }
      
      if (transactions) {
        
        const transfers = transactions.map((item: any, index: number) => {
          // Debug: ดูข้อมูล transaction แต่ละรายการ
          console.log(`Transaction ${index}:`, JSON.stringify(item, null, 2));
          console.log(`Raw amount value: ${item.amount} (${typeof item.amount})`);
          
          // จำนวนเงิน - แก้ไขการแปลงตัวเลข 000
          let amountValue = 0;
          
          if (item.amount !== undefined && item.amount !== null) {
            // ถ้าเป็น number ใช้ตรงๆ
            if (typeof item.amount === 'number' && !isNaN(item.amount)) {
              if (item.amount > 0) {
                amountValue = item.amount / 100.0; // แปลงจากสตางค์เป็นบาท
              }
            }
            // ถ้าเป็น string ให้ลองแปลง
            else if (typeof item.amount === 'string') {
              // ลบเลข 0 ที่ไม่จำเป็น และแปลง
              const cleanAmount = item.amount.replace(/[,\s]/g, '');
              const parsedAmount = parseFloat(cleanAmount);
              
              if (!isNaN(parsedAmount) && parsedAmount > 0) {
                // ถ้าเลขใหญ่เกินไป ให้คิดว่าเป็นสตางค์
                if (parsedAmount > 1000) {
                  amountValue = parsedAmount / 100.0;
                } else {
                  amountValue = parsedAmount;
                }
              }
            }
          }
          
          // ข้อมูลผู้ส่งและผู้รับ - ใช้เบอร์โทรศัพท์
          const fromName = item.sender_mobile || 'ไม่ระบุ';
          const toName = item.receiver_mobile || 'ไม่ระบุ';
          
          console.log(`Transaction ${index}: from=${fromName}, to=${toName}, amount=${item.amount} -> ${amountValue} baht`);
          
          const transfer: TransferHistory = {
            id: item.transaction_id || `TRF${String(index + 1).padStart(3, '0')}`,
            fromName: fromName,
            toName: toName,
            amount: amountValue,
            datetime: item.received_time || new Date().toISOString(),
            status: 'completed' as const,
            reference: item.transaction_id || '',
            originalAmount: item.amount,
            searchTime: new Date().toISOString(),
            eventType: item.event_type
          };

          // Auto-save transaction history for each transfer found
          const saveData = {
            phoneNumber: fromName,
            amount: amountValue,
            transactionId: item.transaction_id || `TRF${String(index + 1).padStart(3, '0')}`,
            transactionTime: item.received_time || new Date().toISOString(),
            description: `รับเงินจากการค้นหาโอนเงิน - ${phoneNumber}`,
            sourceType: 'transfer_search'
          };
          
          console.log(`Auto-saving transaction history for transfer ${index + 1}:`, saveData);
          
          this.saveTransactionHistory(saveData).then(result => {
            if (result) {
              console.log(`Successfully saved transaction history for transfer ${index + 1}`);
            } else {
              console.error(`Failed to save transaction history for transfer ${index + 1}`);
            }
          }).catch(error => {
            console.error('Failed to auto-save transaction history:', error);
          });

          return transfer;
        });
        
        console.log('All transfers processed:', transfers.length);
        
        // Trigger refresh of transaction history
        console.log('Triggering transaction history refresh...');
        setTimeout(() => {
          // Send custom event to refresh transaction history
          const event = new CustomEvent('refresh-transaction-history', {
            detail: { 
              source: 'searchTransfersByPhone',
              timestamp: new Date().toISOString(),
              transfersFound: transfers.length
            }
          });
          window.dispatchEvent(event);
        }, 1000); // Wait 1 second for database to be updated
        
        return transfers;
      }
      
      // Fallback case - ไม่พบ transactions
      console.log('No transactions found in response');
      return [];
      
    } catch (error) {
      console.error('Failed to search transfers:', error);
      throw error;
    }
  }

  async saveTransactionHistory(data: {
    phoneNumber: string;
    amount: number;
    transactionId: string;
    transactionTime: string;
    description?: string;
    sourceType?: string;
  }): Promise<boolean> {
    try {
      console.log('Saving transaction history with data:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/save-transaction-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      console.log('Save transaction history response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save transaction history API error:', response.status, response.statusText, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Save transaction history result:', result);
      
      if (result.error) {
        console.error('Save transaction history business error:', result.error);
        throw new Error(result.error.message);
      }

      console.log('Transaction history saved successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to save transaction history:', error);
      return false;
    }
  }

  async getTransactionHistory(filters?: {
    startDate?: string;
    endDate?: string;
    phoneNumber?: string;
    limit?: number;
  }): Promise<{
    transactions: any[];
    summary: {
      totalTransactions: number;
      totalAmount: number;
      dailyTotals: Array<{ date: string; total: number; count: number }>;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.phoneNumber) params.append('phoneNumber', filters.phoneNumber);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `${this.supabaseUrl}/functions/v1/get-transaction-history?${params.toString()}`;
      
      console.log('Fetching transaction history with URL:', url);
      console.log('Filters:', filters);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Transaction history response:', result);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      const data = result.data;
      console.log('Transaction history data:', data);
      
      return data;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }
}

export const trueWalletService = new TrueWalletService();