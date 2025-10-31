import type { BalanceData, Transaction, TransferHistory } from '../types';

// Supabase configuration - ใช้จาก Settings
const SUPABASE_URL = 'https://dltmbajfuvbnipnfvcrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdG1iYWpmdXZibmlwbmZ2Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDI1MjUsImV4cCI6MjA3NzUxODUyNX0.vgmFY5TRjzrLHCKLPf2cTgrLFKcNbItzC6_StDu9xPI';

// TrueMoney API endpoints ที่ทดสอบแล้ว
const TRUEMONEY_ENDPOINTS = {
  balance: 'https://apis.truemoneyservices.com/account/v1/balance',
  transactions: 'https://apis.truemoneyservices.com/account/v1/my-last-receive',
  transferSearch: 'https://apis.truemoneyservices.com/account/v1/my-receive'
};

// Tokens ที่ทดสอบแล้ว (เป็นค่าเริ่มต้น)
const DEFAULT_TOKENS = {
  balance: '5627a2c2088405f97c0608e09f827e2d',
  transactions: 'fa52cb89ccde1818855aad656cc20f8b',
  transferSearch: 'cd58e01134106a58919ff1e89184cb4c' // Token ใหม่ที่ทดสอบสำเร็จ
};

const STORAGE_KEY = 'true-wallet-api-config';

interface APIConfig {
  balanceApiUrl: string;
  balanceApiToken: string;
  transactionsApiUrl: string;
  transactionsApiToken: string;
  transferSearchApiUrl: string;
  transferSearchApiToken: string;
}

export class TrueWalletService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private apiConfig: APIConfig;

  constructor() {
    this.supabaseUrl = SUPABASE_URL;
    this.supabaseKey = SUPABASE_ANON_KEY;
    this.apiConfig = this.loadApiConfig();
    
    // Listen for config updates
    window.addEventListener('api-config-updated', ((event: CustomEvent) => {
      this.apiConfig = event.detail;
      console.log('API config updated:', this.apiConfig);
    }) as EventListener);
  }

  private loadApiConfig(): APIConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ โหลด API config จาก localStorage:', parsed);
        
        // ตรวจสอบและปรับปรุงการตั้งค่าหากจำเป็น
        const updatedConfig = {
          ...parsed,
          // ตรวจสอบว่า transactionsApiUrl ถูกต้อง
          transactionsApiUrl: parsed.transactionsApiUrl || TRUEMONEY_ENDPOINTS.transactions,
          transactionsApiToken: parsed.transactionsApiToken || DEFAULT_TOKENS.transactions,
        };
        
        console.log('🔧 ใช้ Transactions API:', {
          url: updatedConfig.transactionsApiUrl,
          token: updatedConfig.transactionsApiToken ? `${updatedConfig.transactionsApiToken.substring(0, 8)}...` : 'ไม่พบ'
        });
        
        return updatedConfig;
      }
    } catch (error) {
      console.error('❌ Failed to load API config:', error);
    }
    
    // ใช้ TrueMoney endpoints และ tokens ที่ทดสอบแล้ว (Default config)
    console.log('🚀 ใช้ default Transactions API config');
    return {
      balanceApiUrl: TRUEMONEY_ENDPOINTS.balance,
      balanceApiToken: DEFAULT_TOKENS.balance,
      transactionsApiUrl: TRUEMONEY_ENDPOINTS.transactions,
      transactionsApiToken: DEFAULT_TOKENS.transactions,
      transferSearchApiUrl: TRUEMONEY_ENDPOINTS.transferSearch,
      transferSearchApiToken: DEFAULT_TOKENS.transferSearch,
    };
  }

  private getFullUrl(endpoint: string): string {
    // สำหรับ TrueMoney APIs ใช้ URL โดยตรง
    if (endpoint.startsWith('https://')) {
      return endpoint;
    }
    // สำหรับ Supabase edge functions
    return `${this.supabaseUrl}${endpoint}`;
  }

  async fetchBalance(): Promise<BalanceData> {
    try {
      // ใช้ Balance API โดยตรง (ไม่ผ่าน Supabase proxy)
      const balanceUrl = this.apiConfig.balanceApiUrl || TRUEMONEY_ENDPOINTS.balance;
      const balanceToken = this.apiConfig.balanceApiToken || DEFAULT_TOKENS.balance;
      
      console.log('🔧 ตรวจสอบ Balance API Config:');
      console.log('  - URL:', balanceUrl);
      console.log('  - Token:', balanceToken ? `${balanceToken.substring(0, 8)}...` : 'ไม่พบ');
      console.log('  - ปลายทาง:', balanceUrl === TRUEMONEY_ENDPOINTS.balance ? '✅ Direct API call' : '🔧 Custom');
      
      if (!balanceUrl) {
        throw new Error('Balance API URL ไม่พบ');
      }
      
      if (!balanceToken) {
        throw new Error('Balance API Token ไม่พบ');
      }

      console.log('💰 เรียก Balance API ด้วย URL:', balanceUrl);
      console.log('🔑 ใช้ token:', balanceToken.substring(0, 8) + '...');

      // เรียก TrueMoney Balance API โดยตรง (GET method) พร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      
      const response = await fetch(balanceUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${balanceToken}`,
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Balance API Token ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('Balance API URL ไม่พบ');
        } else {
          throw new Error(`Balance API Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Balance API Response:', result);
      
      // ตรวจสอบ status
      if (result.status === 'err') {
        console.error('❌ Balance API business error:', result.err);
        throw new Error(result.err || 'ไม่สามารถดึงข้อมูลยอดเงินได้');
      }
      
      // TrueMoney API returns: { status: "ok", data: { balance: "7018725", mobile_no: "...", updated_at: "..." } }
      console.log('🔍 กำลังประมวลผลข้อมูล balance...');
      
      if (!result.data || !result.data.balance) {
        console.error('❌ ไม่พบข้อมูล balance ใน response:', result);
        throw new Error('ไม่พบข้อมูลยอดเงิน');
      }
      
      // แปลงจากสตางค์เป็นบาท (Balance API ส่งเป็นสตางค์)
      const balanceInBaht = parseFloat(result.data.balance || 0) / 100;
      
      console.log('💰 Balance ข้อมูลที่แปลงแล้ว:');
      console.log(`  - ยอดเงิน: ${balanceInBaht.toLocaleString()} THB`);
      console.log(`  - เบอร์โทรศัพท์: ${result.data.mobile_no || 'ไม่ระบุ'}`);
      console.log(`  - อัพเดทล่าสุด: ${result.data.updated_at || 'ไม่ทราบ'}`);
      console.log(`  - สกุลเงิน: THB`);
      
      return {
        currentBalance: balanceInBaht, // แปลงจากสตางค์เป็นบาท
        currency: 'THB',
        timestamp: result.data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error);
      // แสดงข้อผิดพลาดที่เข้าใจง่ายสำหรับผู้ใช้
      if (error.name === 'AbortError') {
        throw new Error('⏰ การเชื่อมต่อ Balance API หมดเวลา (10 วินาที)');
      }
      throw error;
    }
  }

  async fetchRecentTransactions(): Promise<Transaction[]> {
    try {
      // ใช้ Transactions API URL และ Token ที่ถูกต้องเสมอ
      const transactionsUrl = this.apiConfig.transactionsApiUrl || TRUEMONEY_ENDPOINTS.transactions;
      const transactionsToken = this.apiConfig.transactionsApiToken || DEFAULT_TOKENS.transactions;
      
      console.log('🔧 ตรวจสอบ Transactions API Config:');
      console.log('  - URL:', transactionsUrl);
      console.log('  - Token:', transactionsToken ? `${transactionsToken.substring(0, 8)}...` : 'ไม่พบ');
      console.log('  - ปลายทาง:', transactionsUrl === TRUEMONEY_ENDPOINTS.transactions ? '✅ Default (my-last-receive)' : '🔧 Custom');
      
      if (!transactionsUrl) {
        throw new Error('Transactions API URL ไม่พบ');
      }
      
      if (!transactionsToken) {
        throw new Error('Transactions API Token ไม่พบ');
      }

      console.log('📡 เรียก Transactions API ด้วย URL:', transactionsUrl);
      console.log('🔑 ใช้ token:', transactionsToken.substring(0, 8) + '...');

      // เรียก TrueMoney Transactions API (my-last-receive) โดยตรง พร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      
      const response = await fetch(transactionsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${transactionsToken}`,
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Transactions API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: transactionsUrl
        });
        
        if (response.status === 401) {
          throw new Error('🔐 Transactions API Token ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('🔍 Transactions API URL ไม่พบ');
        } else {
          throw new Error(`❌ Transactions API Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Transactions API Response:', result);
      
      // ตรวจสอบ status
      if (result.status === 'err') {
        throw new Error(result.err || 'ไม่สามารถดึงข้อมูลธุรกรรมได้');
      }
      
      // TrueMoney API returns: { status: "ok", data: { transactions: [...] } } หรือ { status: "ok", data: {...} }
      const transactionData = result.data;
      
      if (!transactionData) {
        console.log('No transaction data found in response');
        return []; // ไม่มีข้อมูลธุรกรรม
      }
      
      // Convert single transaction to array
      const transactions = Array.isArray(transactionData) ? transactionData : [transactionData];
      
      const processedTransactions = transactions.map((item: any, index: number) => {
        const amountValue = parseFloat(item.amount || 0) / 100.0; // แปลงจากสตางค์เป็นบาท
        
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

        // Auto-save transaction history for each recent transaction (ไม่ทำให้ main process หยุดทำงาน)
        this.saveTransactionHistory({
          phoneNumber: item.sender_mobile || '',
          amount: amountValue,
          transactionId: item.transaction_id || `TXN${String(index + 1).padStart(3, '0')}`,
          transactionTime: item.received_time || new Date().toISOString(),
          description: `รับเงินรายการล่าสุด - ${item.event_type === 'P2P' ? 'รับโอนเงิน' : 'รายการอื่น'}`,
          sourceType: 'recent_transactions'
        }).catch(error => {
          console.warn('⚠️ Failed to auto-save recent transaction history (ไม่กระทบการแสดงผลหลัก):', error.message);
          // ไม่ throw error เพื่อไม่ให้หยุดการแสดงผลหลัก
        });

        return transaction;
      });

      return processedTransactions;
    } catch (error) {
      console.error('❌ Failed to fetch recent transactions:', error);
      // แสดงข้อผิดพลาดที่เข้าใจง่ายสำหรับผู้ใช้
      if (error.name === 'AbortError') {
        throw new Error('⏰ การเชื่อมต่อ Transactions API หมดเวลา (10 วินาที)');
      }
      throw error;
    }
  }

  async searchTransfersByPhone(phoneNumber: string, amount?: number): Promise<TransferHistory[]> {
    try {
      console.log('🔍 เริ่มการค้นหาเบอร์โทรศัพท์:', phoneNumber);
      
      // ใช้ Transfer Search API ด้วย parameters ที่ถูกต้อง
      const url = this.apiConfig.transferSearchApiUrl || TRUEMONEY_ENDPOINTS.transferSearch;
      const token = this.apiConfig.transferSearchApiToken || DEFAULT_TOKENS.transferSearch;
      
      console.log('🔧 Transfer Search API Config:');
      console.log('  - URL:', url);
      console.log('  - Token:', token ? `${token.substring(0, 8)}...` : 'ไม่พบ');
      console.log('  - ปลายทาง:', url === TRUEMONEY_ENDPOINTS.transferSearch ? '✅ Transfer Search API' : '🔧 Custom');
      
      // Parameters สำหรับ Transfer Search API ที่ทดสอบสำเร็จแล้ว
      const requestBody = {
        type: 'P2P',  // ต้องเป็น "P2P" เท่านั้น
        sender_mobile: phoneNumber,  // เบอร์โทรศัพท์ผู้ส่ง (10 หลัก)
        quantity: 7  // จำนวนวันย้อนหลัง (1-180 วัน)
      };
      
      console.log('📤 ส่ง request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error('❌ Transfer Search API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          phoneNumber: phoneNumber,
          requestBody: requestBody
        });
        
        if (response.status === 401) {
          throw new Error('🔐 Transfer Search API Token ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('🔍 Transfer Search API URL ไม่พบ');
        } else if (response.status === 429) {
          throw new Error('⚠️ เรียกใช้งานมากเกินกว่าที่กำหนด (30 ครั้ง/30 วินาที)');
        } else {
          throw new Error(`❌ Transfer Search API Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Transfer Search API Response:', result);
      console.log('📱 กำลังประมวลผลผลลัพธ์สำหรับเบอร์:', phoneNumber);
      
      // ตรวจสอบ status
      if (result.status === 'err') {
        throw new Error(result.err || 'ไม่สามารถดึงข้อมูลธุรกรรมได้');
      }

      // Transfer Search API returns: { status: "ok", data: { system_code: 1000, system_message: "Data retrieved completely.", transactions: [...] } }
      const apiData = result.data;
      
      if (!apiData || !apiData.transactions) {
        console.log('❌ ไม่พบข้อมูลธุรกรรมสำหรับเบอร์:', phoneNumber);
        return []; // ไม่มีข้อมูล
      }
      
      // ตรวจสอบ system_code
      if (apiData.system_code === 1000) {
        console.log('✅ Data retrieved completely');
      } else {
        console.log('⚠️ System code:', apiData.system_code, '-', apiData.system_message);
      }
      
      const transactions = Array.isArray(apiData.transactions) ? apiData.transactions : [];
      
      console.log(`📊 พบธุรกรรมทั้งหมด: ${transactions.length} รายการ`);
      console.log(`🎯 ธุรกรรมสำหรับเบอร์ ${phoneNumber} (ทั้งหมดเป็น sender_mobile): ${transactions.length} รายการ`);
      
      if (transactions.length === 0) {
        console.log(`🔍 ไม่พบธุรกรรมสำหรับเบอร์ ${phoneNumber}`);
        return [];
      }
      
      console.log('✅ พบรายการธุรกรรม', transactions.length, 'รายการ สำหรับเบอร์:', phoneNumber);
      
      const transfers = transactions.map((item: any, index: number) => {
          // Debug: ดูข้อมูล transaction แต่ละรายการ
          console.log(`Transaction ${index}:`, JSON.stringify(item, null, 2));
          console.log(`Raw amount value: ${item.amount} (${typeof item.amount})`);
          
          // จำนวนเงิน - Transfer Search API ส่งเป็นสตางค์
          let amountValue = 0;
          
          if (item.amount !== undefined && item.amount !== null) {
            const amountNum = parseFloat(item.amount.toString());
            if (!isNaN(amountNum) && amountNum > 0) {
              amountValue = amountNum / 100.0; // แปลงจากสตางค์เป็นบาท
            }
          }
          
          // ข้อมูลผู้ส่งและผู้รับ
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
            eventType: item.event_type || 'P2P'
          };

          // Auto-save transaction history for each transfer found
          const saveData = {
            phoneNumber: fromName,
            amount: amountValue,
            transactionId: item.transaction_id || `TRF${String(index + 1).padStart(3, '0')}`,
            transactionTime: item.received_time || new Date().toISOString(),
            description: `รับเงินจากการค้นหาโอนเงิน - ${phoneNumber} (Transfer Search API)`,
            sourceType: 'transfer_search'
          };
          
          console.log(`Auto-saving transaction history for transfer ${index + 1}:`, saveData);
          
          this.saveTransactionHistory(saveData).then(result => {
            if (result) {
              console.log(`✅ Successfully saved transaction history for transfer ${index + 1}`);
            } else {
              console.warn(`⚠️ Failed to save transaction history for transfer ${index + 1} (ไม่กระทบผลการค้นหา)`);
            }
          }).catch(error => {
            console.warn(`⚠️ Failed to auto-save transfer history ${index + 1} (ไม่กระทบผลการค้นหา):`, error.message);
            // ไม่ throw error เพื่อไม่ให้หยุดการแสดงผลหลัก
          });

          return transfer;
        });
        
        console.log('✅ ประมวลผล transfers เสร็จสิ้น:', transfers.length, 'รายการ');
        console.log('📋 ข้อมูล transfers:', transfers);
        
        // Trigger refresh of transaction history
        console.log('🔄 กำลัง refresh transaction history...');
        setTimeout(() => {
          // Send custom event to refresh transaction history
          const event = new CustomEvent('refresh-transaction-history', {
            detail: { 
              source: 'searchTransfersByPhone',
              phoneNumber: phoneNumber,
              timestamp: new Date().toISOString(),
              transfersFound: transfers.length,
              apiUsed: 'Transfer Search API'
            }
          });
          window.dispatchEvent(event);
        }, 1000); // Wait 1 second for database to be updated
        
        console.log('✅ การค้นหาเบอร์', phoneNumber, 'เสร็จสิ้น พบ', transfers.length, 'รายการ (ใช้ Transfer Search API)');
        return transfers;
      
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
      console.log('💾 Attempting to save transaction history:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/save-transaction-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      console.log('📡 Save transaction history response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Save transaction history API error (ไม่กระทบฟีเจอร์หลัก): ${response.status} ${response.statusText}`, errorText);
        return false; // ไม่ throw error เพื่อไม่ให้หยุดการทำงานหลัก
      }

      const result = await response.json();
      console.log('✅ Save transaction history result:', result);
      
      if (result.error) {
        console.warn(`⚠️ Save transaction history business error (ไม่กระทบฟีเจอร์หลัก):`, result.error);
        return false;
      }

      console.log('✅ Transaction history saved successfully:', result);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to save transaction history (ไม่กระทบฟีเจอร์หลัก):`, error.message);
      return false; // ไม่ throw error เพื่อไม่ให้หยุดการทำงานหลัก
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