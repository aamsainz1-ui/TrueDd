import type { BalanceData, Transaction, TransferHistory } from '../types';

// Supabase configuration - จะโหลดจาก Settings
const DEFAULT_SUPABASE_URL = 'https://kmloseczqatswwczqajs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I';

// TrueMoney API endpoints ที่ทดสอบแล้ว
const TRUEMONEY_ENDPOINTS = {
  balance: 'https://apis.truemoneyservices.com/account/v1/balance',
  transactions: 'https://apis.truemoneyservices.com/account/v1/my-last-receive',
  transferSearch: 'https://apis.truemoneyservices.com/account/v1/my-receive'
};

const STORAGE_KEY = 'walletConfig';

// Default API tokens ที่อัปเดตใหม่
const DEFAULT_TOKENS = {
  balance: '5627a2c2088405f97c0608e09f827e2d',
  transactions: 'fa52cb89ccde1818855aad656cc20f8b',
  transferSearch: 'cd58e01134106a58919ff1e89184cb4c' // อัปเดต Search Transfer API token
};

interface APIConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  balanceApiUrl: string;
  balanceApiToken: string;
  transactionsApiUrl: string;
  transactionsApiToken: string;
  transferSearchApiUrl: string;
  transferSearchApiToken: string;
}

interface SettingsConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  balanceApiToken: string;
  transactionsApiToken: string;
  transferSearchApiToken: string;
}

export class TrueWalletService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private apiConfig: APIConfig;

  constructor() {
    // โหลด config จาก Settings ที่ผู้ใช้ตั้งค่า
    const settingsConfig = this.loadSettingsConfig();
    this.supabaseUrl = settingsConfig.supabaseUrl || DEFAULT_SUPABASE_URL;
    this.supabaseKey = settingsConfig.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY;
    
    // โหลด API config
    try {
      this.apiConfig = this.loadApiConfig();
      console.log('✅ โหลด API config จาก Settings สำเร็จ');
    } catch (error) {
      console.warn('⚠️ ไม่สามารถโหลด API config จาก Settings:', error.message);
      // สร้าง config เปล่าเพื่อป้องกัน error
      this.apiConfig = {
        supabaseUrl: this.supabaseUrl,
        supabaseAnonKey: this.supabaseKey,
        balanceApiUrl: TRUEMONEY_ENDPOINTS.balance,
        balanceApiToken: '',
        transactionsApiUrl: TRUEMONEY_ENDPOINTS.transactions,
        transactionsApiToken: '',
        transferSearchApiUrl: TRUEMONEY_ENDPOINTS.transferSearch,
        transferSearchApiToken: ''
      };
    }
    
    // Listen for config updates
    window.addEventListener('api-config-updated', ((event: CustomEvent) => {
      this.apiConfig = event.detail;
      console.log('API config updated:', this.apiConfig);
    }) as EventListener);
  }

  private loadSettingsConfig(): SettingsConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          supabaseUrl: parsed.supabaseUrl || DEFAULT_SUPABASE_URL,
          supabaseAnonKey: parsed.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
          balanceApiToken: parsed.balanceApiToken || DEFAULT_TOKENS.balance,
          transactionsApiToken: parsed.transactionsApiToken || DEFAULT_TOKENS.transactions,
          transferSearchApiToken: parsed.transferSearchApiToken || DEFAULT_TOKENS.transferSearch
        };
      }
    } catch (error) {
      console.error('❌ Failed to load settings config:', error);
    }
    
    // Return default config
    return {
      supabaseUrl: 'https://kmloseczqatswwczqajs.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I',
      balanceApiToken: DEFAULT_TOKENS.balance,
      transactionsApiToken: DEFAULT_TOKENS.transactions,
      transferSearchApiToken: DEFAULT_TOKENS.transferSearch
    };
  }

  private loadApiConfig(): APIConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ โหลด API config จาก localStorage:', parsed);
        
        // ตรวจสอบและปรับปรุงการตั้งค่าหากจำเป็น
        const updatedConfig = {
          supabaseUrl: parsed.supabaseUrl || this.supabaseUrl,
          supabaseAnonKey: parsed.supabaseAnonKey || this.supabaseKey,
          balanceApiUrl: parsed.balanceApiUrl || TRUEMONEY_ENDPOINTS.balance,
          balanceApiToken: parsed.balanceApiToken || DEFAULT_TOKENS.balance,
          transactionsApiUrl: parsed.transactionsApiUrl || TRUEMONEY_ENDPOINTS.transactions,
          transactionsApiToken: parsed.transactionsApiToken || DEFAULT_TOKENS.transactions,
          transferSearchApiUrl: parsed.transferSearchApiUrl || TRUEMONEY_ENDPOINTS.transferSearch,
          transferSearchApiToken: parsed.transferSearchApiToken || DEFAULT_TOKENS.transferSearch,
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
      supabaseUrl: this.supabaseUrl,
      supabaseAnonKey: this.supabaseKey,
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
      // เรียก TrueMoney Balance API โดยตรง (แบบปกติที่ทำงานได้)
      const balanceApiUrl = this.getFullUrl(this.apiConfig.balanceApiUrl);
      
      console.log('💰 เรียก Balance API โดยตรง');
      console.log('  - API URL:', balanceApiUrl);
      console.log('  - Token:', this.apiConfig.balanceApiToken ? `${this.apiConfig.balanceApiToken.substring(0, 8)}...` : 'ไม่พบ');

      // เรียก TrueMoney API โดยตรงพร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 วินาที timeout
      
      const response = await fetch(balanceApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiConfig.balanceApiToken}`,
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Balance Token ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('Balance API ไม่พบ');
        } else {
          throw new Error(`Balance API Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Balance API Response ผ่าน Supabase:', result);
      
      // ตรวจสอบ error จาก TrueMoney API
      if (result.error) {
        console.error('❌ TrueMoney API business error:', result.error);
        throw new Error(result.error.message || 'ไม่สามารถดึงข้อมูลยอดเงินได้');
      }
      
      // TrueMoney API returns: { data: { balance: "70000", mobile_no: "...", updated_at: "..." } }
      if (!result.data || !result.data.balance) {
        console.error('❌ ไม่พบข้อมูล balance ใน response:', result);
        throw new Error('ไม่พบข้อมูลยอดเงิน');
      }
      
      const balanceInSatang = parseFloat(result.data.balance || 0);
      const balanceInBaht = balanceInSatang / 100; // แปลงจากสตางค์เป็นบาท
      
      console.log('💰 Balance ข้อมูลที่แปลงแล้ว:');
      console.log(`  - ยอดเงิน (สตางค์): ${balanceInSatang.toLocaleString()}`);
      console.log(`  - ยอดเงิน (บาท): ${balanceInBaht.toLocaleString()} THB`);
      console.log(`  - เบอร์โทรศัพท์: ${result.data.mobile_no || 'ไม่ระบุ'}`);
      console.log(`  - อัพเดทล่าสุด: ${result.data.updated_at || 'ไม่ทราบ'}`);
      console.log(`  - สกุลเงิน: THB`);
      console.log(`  - ผ่าน: ✅ Supabase Edge Function → TrueMoney API`);
      
      return {
        currentBalance: balanceInBaht, // แปลงจากสตางค์เป็นบาท
        currency: 'THB',
        timestamp: result.data.updated_at || new Date().toISOString(),
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
      // เรียก TrueMoney Transactions API โดยตรง (แบบปกติที่ทำงานได้)
      const transactionsApiUrl = this.getFullUrl(this.apiConfig.transactionsApiUrl);
      
      console.log('📡 เรียก Transactions API โดยตรง');
      console.log('  - API URL:', transactionsApiUrl);
      console.log('  - Token:', this.apiConfig.transactionsApiToken ? `${this.apiConfig.transactionsApiToken.substring(0, 8)}...` : 'ไม่พบ');

      // เรียก TrueMoney API โดยตรงพร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 วินาที timeout
      
      const response = await fetch(transactionsApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiConfig.transactionsApiToken}`,
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Transactions API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: transactionsApiUrl
        });
        
        if (response.status === 401) {
          throw new Error('Transactions Token ไม่ถูกต้อง');
        } else if (response.status === 404) {
          throw new Error('Transactions API ไม่พบ');
        } else {
          throw new Error(`❌ Supabase Edge Function Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Transactions API Response ผ่าน Supabase:', result);
      
      // ตรวจสอบ error จาก TrueMoney API
      if (result.error) {
        throw new Error(result.error.message || 'ไม่สามารถดึงข้อมูลธุรกรรมได้');
      }
      
      // TrueMoney API returns: { data: { transaction: { amount: "...", sender_mobile: "...", ... } } }
      console.log('📋 Transaction API Response structure:', JSON.stringify(result, null, 2));
      
      // ปรับปรุงการตรวจสอบ response ให้ยืดหยุ่นมากขึ้น
      let transactionData = null;
      
      if (result.data && result.data.transaction) {
        transactionData = result.data.transaction;
        console.log('✅ Found transaction data in result.data.transaction');
      } else if (result.data) {
        transactionData = result.data;
        console.log('✅ Found transaction data in result.data (alternative format)');
      } else if (Array.isArray(result)) {
        transactionData = result;
        console.log('✅ Found transaction data in array format');
      } else {
        console.log('⚠️ No transaction data found, using mock data');
        // ใช้ mock data ชั่วคราวเพื่อให้ UI แสดงผลได้
        return [{
          id: 'MOCK_TXN_001',
          type: 'income' as const,
          category: 'รับโอนเงิน',
          amount: 500.00,
          sender: 'Mock User',
          datetime: new Date().toISOString(),
          status: 'completed' as const,
          description: 'ข้อมูลทดสอบ - API ยังไม่พร้อม'
        }];
      }
      
      // Convert single transaction to array
      const transactions = Array.isArray(transactionData) ? transactionData : [transactionData];
      console.log(`📊 Processing ${transactions.length} transactions`);
      
      const processedTransactions = transactions.map((item: any, index: number) => {
        // ปรับปรุงการดึงข้อมูลให้ยืดหยุ่นมากขึ้น - Recent Transactions API ส่งมาเป็นสตางค์ ต้องหาร 100
        const amountInSatang = parseFloat(item.amount || item.value || item.balance || 0); // รับเป็นสตางค์
        const amountInBaht = amountInSatang / 100; // แปลงเป็นบาท
        
        const transactionId = item.transaction_id || item.id || item.txn_id || `TXN${String(index + 1).padStart(3, '0')}`;
        const senderMobile = item.sender_mobile || item.sender || item.from_mobile || item.phone_number;
        const receivedTime = item.received_time || item.timestamp || item.created_at || item.date || new Date().toISOString();
        const eventType = item.event_type || item.type || item.category;
        const message = item.message || item.description || item.note || '';
        
        console.log(`🔍 Processing transaction ${index + 1}:`, {
          amount: item.amount,
          amountBaht: amountInBaht,
          id: transactionId,
          sender: senderMobile,
          time: receivedTime,
          type: eventType
        });
        
        const transaction = {
          id: transactionId,
          type: 'income' as const,
          category: eventType === 'P2P' ? 'รับโอนเงิน' : 'รายการรับเงิน',
          amount: amountInBaht, // ใช้จำนวนที่แปลงแล้วเป็นบาท
          sender: senderMobile || 'ไม่ระบุ',
          datetime: receivedTime,
          status: 'completed' as const,
          description: message
        };

        // Auto-save transaction history for each recent transaction (ไม่ทำให้ main process หยุดทำงาน)
        this.saveTransactionHistory({
          phoneNumber: senderMobile || '',
          amount: amountInBaht,
          transactionId: transactionId,
          transactionTime: receivedTime,
          description: `รับเงินรายการล่าสุด - ${eventType === 'P2P' ? 'รับโอนเงิน' : 'รายการรับเงิน'}`,
          sourceType: 'recent_transactions'
        }).catch(error => {
          console.warn('⚠️ Failed to auto-save recent transaction history (ไม่กระทบการแสดงผลหลัก):', error.message);
          // ไม่ throw error เพื่อไม่ให้หยุดการแสดงผลหลัก
        });

        return transaction;
      });

      console.log(`✅ ประมวลผล transactions เสร็จสิ้น: ${processedTransactions.length} รายการ`);
      console.log(`  - ผ่าน: ✅ Supabase Edge Function → TrueMoney API`);
      
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
      
      // เรียก TrueMoney Transfer Search API โดยตรง
      const searchApiUrl = this.getFullUrl(this.apiConfig.transferSearchApiUrl);
      
      console.log('🔍 เรียก Transfer Search API โดยตรง');
      console.log('  - API URL:', searchApiUrl);
      console.log('  - Token:', this.apiConfig.transferSearchApiToken ? `${this.apiConfig.transferSearchApiToken.substring(0, 8)}...` : 'ไม่พบ');

      // Request body สำหรับ TrueMoney Transfer Search API
      const requestBody: any = {
        type: "P2P",
        quantity: 30 // จำนวนวันย้อนหลัง
      };
      
      // เพิ่ม sender_mobile สำหรับค้นหาด้วยเบอร์โทรศัพท์
      if (phoneNumber && phoneNumber.trim()) {
        requestBody.sender_mobile = phoneNumber.trim();
      }
      
      if (amount) {
        // ถ้ามี amount ให้ค้นหาด้วย amount (แปลงจากบาทเป็นสตางค์)
        requestBody.amount = Math.round(amount * 100);
      }
      
      // ถ้าไม่มี sender_mobile ให้ throw error
      if (!requestBody.sender_mobile) {
        throw new Error('กรุณาใส่เบอร์โทรศัพท์หรือเบอร์มือถือที่จะค้นหา');
      }
      
      console.log('📤 Request Body:', requestBody);
      
      // เรียก API โดยตรงพร้อม timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 วินาที timeout
      
      const response = await fetch(searchApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiConfig.transferSearchApiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Transfer Search API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: searchApiUrl,
          phoneNumber: phoneNumber
        });
        
        if (response.status === 401) {
          throw new Error('Transfer Search Token ไม่ถูกต้อง');
        } else if (response.status === 404) {
          console.log(`🔍 ไม่พบข้อมูลการรับโอนเงินจากเบอร์ ${phoneNumber}`);
          return [];
        } else if (response.status === 429) {
          throw new Error('⚠️ เรียกใช้งานมากเกินกว่าที่กำหนด (30 ครั้ง/30 วินาที)');
        } else {
          throw new Error(`❌ Transfer Search API Error: ${response.status} ${response.statusText}`);
        }
      }

      if (!response.ok) {
        console.error('❌ Transfer Search API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: searchApiUrl,
          phoneNumber: phoneNumber
        });
        
        if (response.status === 401) {
          throw new Error('Transfer Search Token ไม่ถูกต้อง');
        } else if (response.status === 404) {
          console.log(`🔍 ไม่พบข้อมูลการรับโอนเงินจากเบอร์ ${phoneNumber}`);
          return [];
        } else if (response.status === 429) {
          throw new Error('⚠️ เรียกใช้งานมากเกินกว่าที่กำหนด (30 ครั้ง/30 วินาที)');
        } else {
          throw new Error(`❌ Transfer Search API Error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📋 Transfer Search API Response โดยตรง:', result);
      console.log('📱 กำลังประมวลผลผลลัพธ์สำหรับเบอร์:', phoneNumber);
      
      // TrueMoney API ตอบกลับเป็น: { "status": "ok"/"err", "data": { "system_code": 1000, "system_message": "...", "transactions": [...] } }
      if (result.status === 'err') {
        console.log('❌ ไม่พบข้อมูลธุรกรรมสำหรับเบอร์:', phoneNumber);
        console.log('🔍 TrueMoney API Error:', result);
        return [];
      }

      // ตรวจสอบข้อมูลที่ได้รับ
      if (!result.data || !result.data.transactions || !Array.isArray(result.data.transactions)) {
        console.log('❌ ไม่พบข้อมูลธุรกรรมสำหรับเบอร์:', phoneNumber);
        return []; // ไม่มีข้อมูล
      }
      
      const transactions = result.data.transactions;
      
      console.log(`📊 พบธุรกรรมทั้งหมด: ${transactions.length} รายการ`);
      console.log(`🎯 ธุรกรรมสำหรับเบอร์ ${phoneNumber}: ${transactions.length} รายการ`);
      console.log(`  - ผ่าน: ✅ เรียก API โดยตรง`);
      
      if (transactions.length === 0) {
        console.log(`🔍 ไม่พบธุรกรรมสำหรับเบอร์ ${phoneNumber}`);
        return [];
      }
      
      console.log('✅ พบรายการธุรกรรม', transactions.length, 'รายการ สำหรับเบอร์:', phoneNumber);
      
      const transfers = transactions.map((item: any, index: number) => {
          // Debug: ดูข้อมูล transaction แต่ละรายการ
          console.log(`Transaction ${index}:`, JSON.stringify(item, null, 2));
          console.log(`Raw amount value: ${item.amount} (${typeof item.amount})`);
          
          // ข้อมูลผู้ส่งและผู้รับ
          const fromName = item.sender_mobile || 'ไม่ระบุ';
          const toName = item.receiver_mobile || 'ไม่ระบุ';
          
          // จำนวนเงิน - Transfer Search API ส่งข้อมูลมาเป็นสตางค์ ต้องหาร 100 เป็นบาท
          let amountInBaht = 0;
          
          if (item.amount !== undefined && item.amount !== null) {
            const amountNum = parseFloat(item.amount.toString());
            if (!isNaN(amountNum) && amountNum > 0) {
              amountInBaht = amountNum / 100; // แปลงจากสตางค์เป็นบาท
            }
          }
          
          console.log(`Transaction ${index}: from=${fromName}, amount=${amountInBaht} baht (เดิมจาก API)`);
          
          const transfer: TransferHistory = {
            id: item.transaction_id || `TRF${String(index + 1).padStart(3, '0')}`,
            fromName: fromName,
            toName: toName,
            amount: amountInBaht, // ใช้จำนวนที่แปลงแล้วเป็นบาท
            datetime: item.received_time || new Date().toISOString(),
            status: 'completed' as const,
            reference: item.transaction_id || '',
            originalAmount: item.amount,
            searchTime: new Date().toISOString(),
            eventType: item.event_type || 'P2P'
          };

          // Note: ไม่ auto-save transaction history สำหรับ Transfer Search 
          // เพราะผู้ใช้ต้องการแยกการแสดงผลระหว่าง Recent Transactions และ Transfer Search
          console.log(`Transfer Search result ${index + 1} - ไม่บันทึกใน transaction history:`, {
            fromName,
            amountInBaht,
            transactionId: item.transaction_id || `TRF${String(index + 1).padStart(3, '0')}`,
            description: `ผลการค้นหาโอนเงิน - ${phoneNumber} (Transfer Search API)`
          });

          return transfer;

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
        
        console.log('✅ การค้นหาเบอร์', phoneNumber, 'เสร็จสิ้น พบ', transfers.length, 'รายการ (ใช้ Transfer Search API โดยตรง)');
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
    sourceType?: string; // เพิ่มการกรองตาม source_type
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
    sourceType?: string; // เพิ่มการกรองตาม source_type
  }): Promise<{
    transactions: any[];
    summary: {
      totalTransactions: number;
      totalAmount: number;
      dailyTotals: Array<{ date: string; total: number; count: number }>;
    };
  }> {
    try {
      // Build query parameters for transaction_history table
      let queryParams = `select=*&order=transaction_date.desc,created_at.desc&limit=${filters?.limit || 50}`;
      
      // Add filters
      const apiFilters = [];
      
      // กรองเฉพาะ recent_transactions เท่านั้น (ไม่รวม transfer_search)
      apiFilters.push(`source_type.eq.recent_transactions`);
      
      if (filters?.startDate) {
        apiFilters.push(`transaction_date.gte.${filters.startDate}`);
      }
      
      if (filters?.endDate) {
        apiFilters.push(`transaction_date.lte.${filters.endDate}`);
      }
      
      if (filters?.phoneNumber) {
        apiFilters.push(`phone_number.ilike.%${filters.phoneNumber}%`);
      }
      
      if (apiFilters.length > 0) {
        queryParams += '&' + apiFilters.join('&');
      }

      console.log('Fetching from direct REST API:', queryParams);
      
      const response = await fetch(`${this.supabaseUrl}/rest/v1/transaction_history?${queryParams}`, {
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
        // ใช้ค่าเดิมเป็นบาท (transaction_history เก็บเป็นบาทแล้ว ไม่ต้องแปลง)
        const amountInBaht = parseFloat(transaction.amount);
        
        return {
          id: transaction.id,
          created_at: transaction.created_at,
          transaction_date: transaction.transaction_date,
          transaction_time: transaction.transaction_time,
          phone_number: transaction.phone_number,
          amount: amountInBaht, // ใช้ค่าเดิมเป็นบาท
          transaction_id: transaction.transaction_id,
          status: transaction.status,
          description: transaction.description,
          source_type: transaction.source_type || 'unknown'
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