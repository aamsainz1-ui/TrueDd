import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Check, X, RefreshCw, Save, Download } from 'lucide-react';

interface APIConfig {
  // Supabase Configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // True Wallet API Configuration
  balanceApiToken: string;
  transactionsApiToken: string;
  transferSearchApiToken: string;
  
  // Notification Services
  telegramBotToken: string;
  telegramChatId: string;
  lineNotifyToken: string;
}

interface SaveMessage {
  type: 'success' | 'error';
  message: string;
}

const defaultConfig: APIConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  balanceApiToken: '',
  transactionsApiToken: '',
  transferSearchApiToken: '',
  telegramBotToken: '',
  telegramChatId: '',
  lineNotifyToken: ''
};

const defaultSupabase = {
  supabaseUrl: 'https://dltmbajfuvbnipnfvcrl.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdG1iYWpmdXZibmlwbmZ2Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDI1MjUsImV4cCI6MjA3NzUxODUyNX0.vgmFY5TRjzrLHCKLPf2cTgrLFKcNbItzC6_StDu9xPI'
};

const defaultTrueWallet = {
  balanceApiToken: '5627a2c2088405f97c0608e09f827e2d',
  transactionsApiToken: 'fa52cb89ccde1818855aad656cc20f8b',
  transferSearchApiToken: '040a02532fa166412247a0a304c5bfbc' // อัปเดต token ใหม่สำหรับ Search Transfer API
};

const trueWalletUrls = {
  balance: 'https://apis.truemoneyservices.com/account/v1/balance',
  transactions: 'https://apis.truemoneyservices.com/account/v1/my-last-receive',
  transferSearch: 'https://apis.truemoneyservices.com/account/v1/my-receive'
};

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<APIConfig>(defaultConfig);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    
    // Listen for API config updates
    const handleApiConfigUpdate = () => {
      console.log('Settings received API config update');
      // Reload config to show latest values
      loadConfig();
    };

    window.addEventListener('api-config-updated', handleApiConfigUpdate);
    return () => {
      window.removeEventListener('api-config-updated', handleApiConfigUpdate);
    };
  }, []);

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('walletConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('walletConfig', JSON.stringify(config));
      setSaveMessage({ type: 'success', message: 'บันทึกการตั้งค่าสำเร็จ' });
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
      
      // Also update the TrueWalletService config
      const serviceConfig = {
        balanceApiToken: config.balanceApiToken,
        transactionsApiToken: config.transactionsApiToken,
        transferSearchApiToken: config.transferSearchApiToken,
        balanceApiUrl: 'https://apis.truemoneyservices.com/account/v1/balance',
        transactionsApiUrl: 'https://apis.truemoneyservices.com/account/v1/my-last-receive',
        transferSearchApiUrl: 'https://apis.truemoneyservices.com/account/v1/my-receive'
      };
      window.dispatchEvent(new CustomEvent('api-config-updated', { detail: serviceConfig }));
      
      // Save to localStorage with the key used by TrueWalletService
      localStorage.setItem('true-wallet-api-config', JSON.stringify(serviceConfig));
      
      // Test APIs to verify they work
      await testAllAPIs();
      
      toast.success('บันทึกการตั้งค่าและทดสอบ API สำเร็จ!');
      
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsLoading(false);
    }
  };

  const testAllAPIs = async () => {
    const results = [];
    
    // Test Balance API if token exists
    if (config.balanceApiToken) {
      try {
        await testTrueWalletAPIs('balance');
        results.push('Balance API: ✅ ทำงานได้');
      } catch (error) {
        results.push('Balance API: ❌ มีปัญหา');
      }
    }
    
    // Test Transactions API if token exists
    if (config.transactionsApiToken) {
      try {
        await testTrueWalletAPIs('transactions');
        results.push('Transactions API: ✅ ทำงานได้');
      } catch (error) {
        results.push('Transactions API: ❌ มีปัญหา');
      }
    }
    
    // Test Transfer Search API if token exists
    if (config.transferSearchApiToken) {
      try {
        await testTrueWalletAPIs('transferSearch');
        results.push('Transfer Search API: ✅ ทำงานได้');
      } catch (error) {
        results.push('Transfer Search API: ❌ มีปัญหา');
      }
    }
    
    const message = `ผลการทดสอบ API:\n${results.join('\n')}`;
    setSaveMessage({ 
      type: results.some(r => r.includes('✅')) ? 'success' : 'error', 
      message 
    });
  };

  const handleInputChange = (field: keyof APIConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefault = () => {
    setConfig({ ...defaultConfig, ...defaultSupabase, ...defaultTrueWallet });
    
    // Dispatch events to notify other components
    const newConfig = { ...defaultConfig, ...defaultSupabase, ...defaultTrueWallet };
    window.dispatchEvent(new CustomEvent('configUpdated', { detail: newConfig }));
    
    const serviceConfig = {
      balanceApiToken: defaultTrueWallet.balanceApiToken,
      transactionsApiToken: defaultTrueWallet.transactionsApiToken,
      transferSearchApiToken: defaultTrueWallet.transferSearchApiToken,
      balanceApiUrl: 'https://apis.truemoneyservices.com/account/v1/balance',
      transactionsApiUrl: 'https://apis.truemoneyservices.com/account/v1/my-last-receive',
      transferSearchApiUrl: 'https://apis.truemoneyservices.com/account/v1/my-receive'
    };
    window.dispatchEvent(new CustomEvent('api-config-updated', { detail: serviceConfig }));
  };

  const testSupabaseConnection = async () => {
    try {
      setSaveMessage({ type: 'success', message: 'กำลังทดสอบการเชื่อมต่อ Supabase...' });
      
      if (!config.supabaseUrl || !config.supabaseAnonKey) {
        setSaveMessage({ type: 'error', message: 'กรุณากรอก Supabase URL และ Anon Key' });
        return;
      }

      // Call the api-connection-test Edge Function
      const functionUrl = `${config.supabaseUrl}/functions/v1/api-connection-test`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'full_connection' })
      });

      const result = await response.json();
      
      if (result.success) {
        const testResult = result.data;
        let message = `✅ เชื่อมต่อสำเร็จ!\n`;
        message += `• Environment Variables: ${testResult.envVars ? 'OK' : 'Missing'}\n`;
        message += `• API Connection: ${testResult.apiConnection ? 'OK' : 'Failed'}\n`;
        message += `• Database Structure: ${testResult.database ? 'OK' : 'Error'}\n`;
        message += `• Response Time: ${testResult.responseTime}ms\n`;
        
        if (testResult.database?.tables) {
          message += `• Tables Found: ${testResult.database.tables.join(', ')}`;
        }
        
        setSaveMessage({ type: 'success', message });
      } else {
        const errorCode = result.error?.code || 'UNKNOWN_ERROR';
        const errorMessage = result.error?.message || 'Unknown error';
        const troubleshooting = result.error?.troubleshooting || 'No troubleshooting info available';
        
        setSaveMessage({ 
          type: 'error', 
          message: `❌ เชื่อมต่อล้มเหลว (${errorCode})\n${errorMessage}\n\n🔧 แนะนำ: ${troubleshooting}` 
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setSaveMessage({ 
        type: 'error', 
        message: `❌ เกิดข้อผิดพลาดในการทดสอบ\nError: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wallet-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const testTelegramConnection = async () => {
    try {
      setSaveMessage({ type: 'success', message: 'กำลังทดสอบการเชื่อมต่อ...' });
      
      if (!config.telegramBotToken) {
        setSaveMessage({ type: 'error', message: 'กรุณากรอก Telegram Bot Token' });
        return;
      }

      const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/getMe`);
      
      if (response.ok) {
        const result = await response.json();
        setSaveMessage({ 
          type: 'success', 
          message: `เชื่อมต่อสำเร็จ! Bot: ${result.result.first_name}` 
        });
      } else {
        setSaveMessage({ type: 'error', message: 'การเชื่อมต่อล้มเหลว - ตรวจสอบ Token' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'เกิดข้อผิดพลาดในการทดสอบ' });
    }
  };

  const testLineConnection = async () => {
    try {
      setSaveMessage({ type: 'success', message: 'กำลังทดสอบการเชื่อมต่อ LINE...' });
      
      if (!config.lineNotifyToken) {
        setSaveMessage({ type: 'error', message: 'กรุณากรอก LINE Notify Token' });
        return;
      }

      const response = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.lineNotifyToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'message=ทดสอบการเชื่อมต่อ LINE Notify สำเร็จ!'
      });
      
      if (response.ok) {
        setSaveMessage({ 
          type: 'success', 
          message: 'เชื่อมต่อสำเร็จ! ข้อความทดสอบถูกส่งไป LINE แล้ว' 
        });
      } else {
        setSaveMessage({ type: 'error', message: 'การเชื่อมต่อล้มเหลว - ตรวจสอบ Token' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'เกิดข้อผิดพลาดในการทดสอบ' });
    }
  };

  const testTrueWalletAPIs = async (apiType: 'balance' | 'transactions' | 'transferSearch') => {
    try {
      setSaveMessage({ type: 'success', message: `กำลังทดสอบ${apiType} API...` });
      
      const configs = {
        balance: { token: config.balanceApiToken, name: 'Balance' },
        transactions: { token: config.transactionsApiToken, name: 'Transactions' },
        transferSearch: { token: config.transferSearchApiToken, name: 'Transfer Search' }
      };
      
      const currentConfig = configs[apiType];
      const url = trueWalletUrls[apiType];
      
      if (!currentConfig.token) {
        setSaveMessage({ type: 'error', message: `กรุณากรอก${currentConfig.name} API Token` });
        return;
      }

      // ใช้ GET method สำหรับ True Wallet APIs ทั้งหมด
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentConfig.token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        let successMessage = `✅ ${currentConfig.name} API เชื่อมต่อสำเร็จ!\n`;
        successMessage += `• URL: ${url}\n`;
        successMessage += `• Response Status: ${response.status}\n`;
        successMessage += `• Method: GET`;
        if (result.data) {
          successMessage += `\n• ข้อมูล: ${JSON.stringify(result.data)}`;
        }
        
        setSaveMessage({ type: 'success', message: successMessage });
      } else {
        let errorMessage = `❌ ${currentConfig.name} API เชื่อมต่อล้มเหลว!\n`;
        errorMessage += `• URL: ${url}\n`;
        errorMessage += `• Status: ${response.status} ${response.statusText}\n`;
        
        if (response.status === 401) {
          errorMessage += `• ปัญหา: Token ไม่ถูกต้องหรือหมดอายุ`;
        } else if (response.status === 403) {
          errorMessage += `• ปัญหา: ไม่มีสิทธิ์เข้าถึง API`;
        } else if (response.status === 404) {
          errorMessage += `• ปัญหา: URL ไม่ถูกต้องหรือ API ไม่พบ`;
        } else {
          errorMessage += `• ปัญหา: ${response.statusText}`;
        }
        
        setSaveMessage({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      console.error('Test True Wallet API error:', error);
      setSaveMessage({ 
        type: 'error', 
        message: `❌ เกิดข้อผิดพลาดในการทดสอบ\nError: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">การตั้งค่า API</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">จัดการ API Endpoints สำหรับเชื่อมต่อกับ True Wallet</p>
          </div>
        </div>

        {saveMessage && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {saveMessage.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span className="text-sm sm:text-base font-medium">{saveMessage.message}</span>
            </div>
          </div>
        )}

        {/* Supabase Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">การตั้งค่า Supabase</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                Supabase URL
              </label>
              <input
                type="url"
                value={config.supabaseUrl}
                onChange={(e) => handleInputChange('supabaseUrl', e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                placeholder="https://your-project.supabase.co"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                Supabase Anon Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={config.supabaseAnonKey}
                  onChange={(e) => handleInputChange('supabaseAnonKey', e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
                <button
                  onClick={testSupabaseConnection}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-h-[44px] flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>ทดสอบการเชื่อมต่อ</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">🔑 วิธีหา Supabase URL และ Anon Key:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>1. เข้าสู่ Supabase Dashboard ของคุณ</li>
              <li>2. เลือก Project ที่ต้องการใช้งาน</li>
              <li>3. ไปที่ Settings → API</li>
              <li>4. คัดลอก URL และ Anon Key</li>
            </ul>
          </div>
        </div>

        {/* True Wallet API Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">การตั้งค่า True Wallet API</h3>
          
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-900 mb-2">✅ สถานะการทดสอบ API:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ <strong>Balance API</strong>: ใช้ได้ - Token ถูกเติมให้แล้ว</li>
              <li>✅ <strong>Transfer Search API</strong>: ใช้ได้ - Token ถูกเติมให้แล้ว</li>
              <li>⚠️ <strong>Transaction API</strong>: ต้องการ Token ใหม่ - ยังไม่ทำงาน</li>
            </ul>
          </div>
          <div className="grid gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Balance API Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={config.balanceApiToken}
                    onChange={(e) => handleInputChange('balanceApiToken', e.target.value)}
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="your-balance-api-token"
                  />
                  <button
                    onClick={() => testTrueWalletAPIs('balance')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>ทดสอบ</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  URL: {trueWalletUrls.balance}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Transactions API Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={config.transactionsApiToken}
                    onChange={(e) => handleInputChange('transactionsApiToken', e.target.value)}
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="your-transactions-api-token"
                  />
                  <button
                    onClick={() => testTrueWalletAPIs('transactions')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>ทดสอบ</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  URL: {trueWalletUrls.transactions}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Transfer Search API Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={config.transferSearchApiToken}
                    onChange={(e) => handleInputChange('transferSearchApiToken', e.target.value)}
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="your-transfer-search-api-token"
                  />
                  <button
                    onClick={() => testTrueWalletAPIs('transferSearch')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>ทดสอบ</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  URL: {trueWalletUrls.transferSearch}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveConfig}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px] w-full sm:w-auto touch-manipulation"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">บันทึกการตั้งค่า API</span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">📱 วิธีหา True Wallet API Token:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>1. ลงทะเบียนกับ TrueMoney Services</li>
              <li>2. ขอ API Access จาก TrueMoney Developer Portal</li>
              <li>3. รับ API Tokens สำหรับ Balance, Transactions และ Transfer Search</li>
              <li>4. ใส่ Tokens ในการตั้งค่าด้านบน (URL ใช้ค่าเริ่มต้นแล้ว)</li>
            </ul>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                💡 <strong>เคล็ดลับ:</strong> กดปุ่ม "ทดสอบ" หลังจากใส่ Token เพื่อตรวจสอบการเชื่อมต่อ
              </p>
            </div>
          </div>
        </div>

        {/* Telegram Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">การตั้งค่า Telegram</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                Telegram Bot Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={config.telegramBotToken}
                  onChange={(e) => handleInputChange('telegramBotToken', e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                />
                <button
                  onClick={testTelegramConnection}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-h-[44px]"
                >
                  ทดสอบ
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                Telegram Chat ID
              </label>
              <input
                type="text"
                value={config.telegramChatId}
                onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                placeholder="123456789"
              />
            </div>
          </div>
        </div>

        {/* LINE Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">การตั้งค่า LINE Notify</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                LINE Notify Access Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={config.lineNotifyToken}
                  onChange={(e) => handleInputChange('lineNotifyToken', e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="your-line-notify-token"
                />
                <button
                  onClick={testLineConnection}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-h-[44px]"
                >
                  ทดสอบ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={saveConfig}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px] w-full sm:w-auto touch-manipulation"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">บันทึกการตั้งค่าทั้งหมด</span>
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium min-h-[44px] w-full sm:w-auto touch-manipulation"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">โหลดการตั้งค่า</span>
          </button>

          <button
            onClick={resetToDefault}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium min-h-[44px] w-full sm:w-auto touch-manipulation"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">รีเซ็ตเป็นค่าเริ่มต้น</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1.5 sm:mb-2">คำแนะนำการใช้งาน</h3>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1 sm:space-y-1.5">
            <li className="leading-relaxed">• URL สามารถเป็น relative path เช่น /functions/v1/api-name หรือ absolute URL</li>
            <li className="leading-relaxed">• กดปุ่ม "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบว่า API ทำงานได้หรือไม่</li>
            <li className="leading-relaxed">• บันทึกการตั้งค่าจะถูกบันทึกไว้ใน Browser localStorage</li>
            <li className="leading-relaxed">• การตั้งค่าจะถูกบันทึกไว้ใน Browser localStorage</li>
          </ul>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <h4 className="text-xs font-semibold text-blue-900 mb-1">🔑 วิธีรับ Telegram Bot Token:</h4>
            <ol className="text-xs text-blue-800 space-y-0.5 pl-2">
              <li>1. เริ่มแชทกับ @BotFather ใน Telegram</li>
              <li>2. ส่งคำสั่ง /newbot และทำตามขั้นตอน</li>
              <li>3. คัดลอก Bot Token ที่ได้</li>
            </ol>
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <h4 className="text-xs font-semibold text-blue-900 mb-1">💬 วิธีรับ LINE Access Token:</h4>
            <ol className="text-xs text-blue-800 space-y-0.5 pl-2">
              <li>1. ไปที่ https://notify-bot.line.me/authorize</li>
              <li>2. เข้าสู่ระบบและอนุญาตการแจ้งเตือน</li>
              <li>3. คัดลอก Access Token ที่ได้รับ</li>
            </ol>
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <h4 className="text-xs font-semibold text-blue-900 mb-1">📋 Chat ID สำหรับ Telegram:</h4>
            <ul className="text-xs text-blue-800 space-y-0.5">
              <li>• ส่วนตัว: เข้ากับ Bot และส่งข้อความใดๆ</li>
              <li>• กลุ่ม: เพิ่ม Bot เข้ากลุ่ม และดู Chat ID จาก URL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};