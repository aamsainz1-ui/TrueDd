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
      // ใช้ Supabase Edge Function แทน TrueMoney API โดยตรง (แก้ปัญหา CORS)
      const supabaseUrl = `${this.supabaseUrl}/functions/v1/true-wallet-balance`;
      
      console.log('🔧 ใช้ Supabase Edge Function สำหรับ Balance API');
      console.log('  - Supabase URL:', supabaseUrl);
      console.log('  - ปลายทาง: ✅ Supabase Edge Function');

      console.log('💰 เรียก Balance API ผ่าน Supabase Edge Function');
      console.log('🔑 ใช้ token ที่กำหนดไว้ใน Edge Function');

      // เรียก Supabase Edge Function พร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 วินาที timeout
      
      const response = await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Edge function จะใช้ token ที่กำหนดไว้ในโค้ด
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Supabase Authorization ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('Supabase Edge Function ไม่พบ');
        } else {
          throw new Error(`Supabase Edge Function Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Balance API Response ผ่าน Supabase:', result);
      
      // ตรวจสอบ error จาก Edge Function
      if (result.error) {
        console.error('❌ Supabase Edge Function business error:', result.error);
        throw new Error(result.error.message || 'ไม่สามารถดึงข้อมูลยอดเงินได้');
      }
      
      // Edge Function returns: { data: balanceData, timestamp: "..." }
      const balanceData = result.data;
      
      if (!balanceData || !balanceData.data || !balanceData.data.balance) {
        console.error('❌ ไม่พบข้อมูล balance ใน response:', result);
        throw new Error('ไม่พบข้อมูลยอดเงิน');
      }
      
      // แปลงจากสตางค์เป็นบาท (Balance API ส่งเป็นสตางค์)
      const balanceInBaht = parseFloat(balanceData.data.balance || 0) / 100;
      
      console.log('💰 Balance ข้อมูลที่แปลงแล้ว:');
      console.log(`  - ยอดเงิน: ${balanceInBaht.toLocaleString()} THB`);
      console.log(`  - เบอร์โทรศัพท์: ${balanceData.data.mobile_no || 'ไม่ระบุ'}`);
      console.log(`  - อัพเดทล่าสุด: ${balanceData.data.updated_at || 'ไม่ทราบ'}`);
      console.log(`  - สกุลเงิน: THB`);
      console.log(`  - ผ่าน: ✅ Supabase Edge Function`);
      
      return {
        currentBalance: balanceInBaht, // แปลงจากสตางค์เป็นบาท
        currency: 'THB',
        timestamp: balanceData.data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error);
      // แสดงข้อผิดพลาดที่เข้าใจง่ายสำหรับผู้ใช้
      if (error.name === 'AbortError') {
        throw new Error('⏰ การเชื่อมต่อ Balance API หมดเวลา (15 วินาที)');
      }
      throw error;
    }
  }

  async fetchRecentTransactions(): Promise<Transaction[]> {
    try {
      // ใช้ Supabase Edge Function แทน TrueMoney API โดยตรง (แก้ปัญหา CORS)
      const supabaseUrl = `${this.supabaseUrl}/functions/v1/true-wallet-transactions`;
      
      console.log('🔧 ใช้ Supabase Edge Function สำหรับ Transactions API');
      console.log('  - Supabase URL:', supabaseUrl);
      console.log('  - ปลายทาง: ✅ Supabase Edge Function');

      console.log('📡 เรียก Transactions API ผ่าน Supabase Edge Function');
      console.log('🔑 ใช้ token ที่กำหนดไว้ใน Edge Function');

      // เรียก Supabase Edge Function พร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 วินาที timeout
      
      const response = await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Edge function จะใช้ token ที่กำหนดไว้ในโค้ด
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Transactions API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: supabaseUrl
        });
        
        if (response.status === 401) {
          throw new Error('Supabase Authorization ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('Supabase Edge Function ไม่พบ');
        } else {
          throw new Error(`❌ Supabase Edge Function Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Transactions API Response ผ่าน Supabase:', result);
      
      // ตรวจสอบ error จาก Edge Function
      if (result.error) {
        throw new Error(result.error.message || 'ไม่สามารถดึงข้อมูลธุรกรรมได้');
      }
      
      // Edge Function returns: { data: transactionsData, timestamp: "..." }
      const transactionsData = result.data;
      
      if (!transactionsData || !transactionsData.data) {
        console.log('No transaction data found in response');
        return []; // ไม่มีข้อมูลธุรกรรม
      }
      
      // Convert single transaction to array
      const transactionData = transactionsData.data;
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

      console.log(`✅ ประมวลผล transactions เสร็จสิ้น: ${processedTransactions.length} รายการ`);
      console.log(`  - ผ่าน: ✅ Supabase Edge Function`);
      
      return processedTransactions;
    } catch (error) {
      console.error('❌ Failed to fetch recent transactions:', error);
      // แสดงข้อผิดพลาดที่เข้าใจง่ายสำหรับผู้ใช้
      if (error.name === 'AbortError') {
        throw new Error('⏰ การเชื่อมต่อ Transactions API หมดเวลา (15 วินาที)');
      }
      throw error;
    }
  }

  async searchTransfersByPhone(phoneNumber: string, amount?: number): Promise<TransferHistory[]> {
    try {
      console.log('🔍 เริ่มการค้นหาเบอร์โทรศัพท์:', phoneNumber);
      
      // ใช้ Supabase Edge Function แทน TrueMoney API โดยตรง (แก้ปัญหา CORS)
      const supabaseUrl = `${this.supabaseUrl}/functions/v1/true-wallet-transfer-search`;
      
      console.log('🔧 ใช้ Supabase Edge Function สำหรับ Transfer Search API');
      console.log('  - Supabase URL:', supabaseUrl);
      console.log('  - ปลายทาง: ✅ Supabase Edge Function');

      // Parameters สำหรับ Transfer Search API ที่ทดสอบสำเร็จแล้ว
      const requestBody = {
        phoneNumber: phoneNumber,  // เบอร์โทรศัพท์ผู้ส่ง (10 หลัก)
        amount: amount // จำนวนเงิน (ถ้ามี)
      };
      
      console.log('📤 ส่ง request body:', JSON.stringify(requestBody, null, 2));
      console.log('🔑 ใช้ token ที่กำหนดไว้ใน Edge Function');
      
      // เรียก Supabase Edge Function พร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 วินาที timeout
      
      const response = await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Transfer Search API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: supabaseUrl,
          phoneNumber: phoneNumber,
          requestBody: requestBody
        });
        
        if (response.status === 401) {
          throw new Error('Supabase Authorization ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('Supabase Edge Function ไม่พบ');
        } else if (response.status === 429) {
          throw new Error('⚠️ เรียกใช้งานมากเกินกว่าที่กำหนด (30 ครั้ง/30 วินาที)');
        } else {
          throw new Error(`❌ Supabase Edge Function Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Transfer Search API Response ผ่าน Supabase:', result);
      console.log('📱 กำลังประมวลผลผลลัพธ์สำหรับเบอร์:', phoneNumber);
      
      // ตรวจสอบ error จาก Edge Function
      if (result.error) {
        throw new Error(result.error.message || 'ไม่สามารถดึงข้อมูลธุรกรรมได้');
      }

      // Edge Function returns: { data: searchData, timestamp: "..." }
      const apiData = result.data;
      
      if (!apiData || !apiData.data || !apiData.data.transactions) {
        console.log('❌ ไม่พบข้อมูลธุรกรรมสำหรับเบอร์:', phoneNumber);
        return []; // ไม่มีข้อมูล
      }
      
      // ตรวจสอบ system_code
      if (apiData.data.system_code === 1000) {
        console.log('✅ Data retrieved completely');
      } else {
        console.log('⚠️ System code:', apiData.data.system_code, '-', apiData.data.system_message);
      }
      
      const transactions = Array.isArray(apiData.data.transactions) ? apiData.data.transactions : [];
      
      console.log(`📊 พบธุรกรรมทั้งหมด: ${transactions.length} รายการ`);
      console.log(`🎯 ธุรกรรมสำหรับเบอร์ ${phoneNumber} (ทั้งหมดเป็น sender_mobile): ${transactions.length} รายการ`);
      console.log(`  - ผ่าน: ✅ Supabase Edge Function`);
      
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
        
        console.log('✅ การค้นหาเบอร์', phoneNumber, 'เสร็จสิ้น พบ', transfers.length, 'รายการ (ใช้ Transfer Search API ผ่าน Supabase)');
        return transfers;
      
    } catch (error) {
      console.error('Failed to search transfers:', error);
      // แสดงข้อผิดพลาดที่เข้าใจง่ายสำหรับผู้ใช้
      if (error.name === 'AbortError') {
        throw new Error('⏰ การเชื่อมต่อ Transfer Search API หมดเวลา (15 วินาที)');
      }
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
      // ลองเรียกใช้ edge function ก่อน
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

      if (response.ok) {
        const result = await response.json();
        console.log('Transaction history response:', result);
        
        if (result.error) {
          throw new Error(result.error.message);
        }

        const data = result.data;
        console.log('Transaction history data:', data);
        
        return data;
      }
      
      // ถ้า edge function ไม่ทำงาน ให้เรียกใช้ REST API โดยตรง
      console.log('Edge function failed, falling back to direct REST API call');
      return await this.getTransactionHistoryDirect(filters);
      
    } catch (error) {
      console.error('Failed to get transaction history via edge function, trying direct API:', error);
      
      // Fallback เรียกใช้ REST API โดยตรง
      try {
        return await this.getTransactionHistoryDirect(filters);
      } catch (directError) {
        console.error('Failed to get transaction history via direct API:', directError);
        throw new Error('ไม่สามารถดึงข้อมูลประวัติรายการได้');
      }
    }
  }

  async getTransactionHistoryDirect(filters?: {
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
      // Build query parameters for transactions table
      let queryParams = `select=*&order=date.desc,created_at.desc&limit=${filters?.limit || 50}`;
      
      // Add filters
      const apiFilters = [];
      
      if (filters?.startDate) {
        apiFilters.push(`date.gte.${filters.startDate}`);
      }
      
      if (filters?.endDate) {
        apiFilters.push(`date.lte.${filters.endDate}`);
      }
      
      if (apiFilters.length > 0) {
        queryParams += '&' + apiFilters.join('&');
      }

      console.log('Fetching from direct REST API:', queryParams);
      
      const response = await fetch(`${this.supabaseUrl}/rest/v1/transactions?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database fetch error: ${response.status} ${errorText}`);
      }

      const transactions = await response.json();
      console.log('Direct API transactions response:', transactions);

      // Transform transactions data to match expected format
      const transformedTransactions = transactions.map((transaction: any) => {
        // แยกเบอร์โทรศัพท์จากคำอธิบาย
        const extractPhoneFromDescription = (description: string) => {
          if (!description) return 'ไม่ระบุ';
          
          // หาเบอร์โทรศัพท์ที่ขึ้นต้นด้วย 0 และมี 10 หลัก
          const phoneMatch = description.match(/(\d{10})/);
          if (phoneMatch) {
            return phoneMatch[1];
          }
          
          // ถ้าไม่มีเบอร์โทรศัพท์ ให้ดูจากคำอธิบายเพื่อกำหนดแหล่งที่มา
          if (description.includes('เงินเดือน')) {
            return 'เงินเดือน';
          }
          if (description.includes('ค่าคอมพิวเตอร์')) {
            return 'ค่าบริการ';
          }
          if (description.includes('ทดสอบ')) {
            return 'ระบบทดสอบ';
          }
          if (description.includes('รับเงินจาก')) {
            return 'รับโอนเงิน';
          }
          
          return 'ไม่ระบุ';
        };

        return {
          id: transaction.id,
          created_at: transaction.created_at,
          transaction_date: transaction.date,
          transaction_time: transaction.created_at ? new Date(transaction.created_at).toTimeString().split(' ')[0] : '00:00:00',
          phone_number: extractPhoneFromDescription(transaction.description),
          amount: parseFloat(transaction.amount),
          transaction_id: `TXN${transaction.id}`,
          status: 'completed',
          description: transaction.description,
          source_type: 'dashboard_transactions'
        };
      });

      // Calculate summary statistics
      const totalAmount = transformedTransactions.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
      const dailyTotals = transformedTransactions.reduce((acc: any, transaction: any) => {
        const date = transaction.transaction_date;
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += transaction.amount;
        acc[date].count += 1;
        return acc;
      }, {});

      const summary = {
        totalTransactions: transformedTransactions.length,
        totalAmount: totalAmount,
        dailyTotals: Object.keys(dailyTotals).map(date => ({
          date,
          total: dailyTotals[date].total,
          count: dailyTotals[date].count
        })).sort((a, b) => b.date.localeCompare(a.date))
      };

      console.log(`Direct API: Retrieved ${transformedTransactions.length} transaction records`);

      return {
        transactions: transformedTransactions,
        summary
      };
    } catch (error) {
      console.error('Failed to get transaction history direct:', error);
      throw error;
    }
  }
}

export const trueWalletService = new TrueWalletService();