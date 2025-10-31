import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Check, X, RefreshCw, Save, Download } from 'lucide-react';

interface APIConfig {
  balanceApiUrl: string;
  balanceApiToken: string;
  transactionsApiUrl: string;
  transactionsApiToken: string;
  transferSearchApiUrl: string;
  transferSearchApiToken: string;
  telegramBotToken: string;
  telegramChatId: string;
  lineNotifyToken: string;
}

interface TestStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const DEFAULT_CONFIG: APIConfig = {
  balanceApiUrl: '/functions/v1/true-wallet-balance',
  balanceApiToken: '',
  transactionsApiUrl: '/functions/v1/true-wallet-transactions',
  transactionsApiToken: '',
  transferSearchApiUrl: '/functions/v1/true-wallet-transfer-search',
  transferSearchApiToken: '',
  telegramBotToken: '',
  telegramChatId: '',
  lineNotifyToken: '',
};

const STORAGE_KEY = 'true-wallet-api-config';

export function Settings() {
  const [config, setConfig] = useState<APIConfig>(DEFAULT_CONFIG);
  const [balanceStatus, setBalanceStatus] = useState<TestStatus>({ status: 'idle' });
  const [transactionsStatus, setTransactionsStatus] = useState<TestStatus>({ status: 'idle' });
  const [transferStatus, setTransferStatus] = useState<TestStatus>({ status: 'idle' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        showSaveMessage('success', 'โหลดการตั้งค่าสำเร็จ');
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      showSaveMessage('error', 'ไม่สามารถโหลดการตั้งค่าได้');
    }
  };

  const saveConfig = () => {
    try {
      setIsSaving(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      
      // Update the service to use new config
      window.dispatchEvent(new CustomEvent('api-config-updated', { detail: config }));
      
      showSaveMessage('success', 'บันทึกการตั้งค่าสำเร็จ');
    } catch (error) {
      console.error('Failed to save config:', error);
      showSaveMessage('error', 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setIsSaving(false);
    }
  };

  const showSaveMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const testConnection = async (
    apiType: 'balance' | 'transactions' | 'transfer',
    url: string,
    token: string,
    setStatus: (status: TestStatus) => void
  ) => {
    setStatus({ status: 'loading', message: 'กำลังทดสอบ...' });

    try {
      // Get Supabase config from service
      const supabaseUrl = 'https://kmloseczqatswwczqajs.supabase.co';
      const apiToken = token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I';

      const fullUrl = url.startsWith('http') ? url : `${supabaseUrl}${url}`;

      let response;
      if (apiType === 'transfer') {
        // Transfer search requires POST with body
        response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: '0000000000' }) // Test with dummy phone
        });
      } else {
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (response.ok) {
        setStatus({ 
          status: 'success', 
          message: `เชื่อมต่อสำเร็จ (${response.status})` 
        });
      } else {
        setStatus({ 
          status: 'error', 
          message: `เชื่อมต่อล้มเหลว (${response.status})` 
        });
      }
    } catch (error) {
      setStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อได้' 
      });
    }
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_CONFIG);
    showSaveMessage('success', 'รีเซ็ตเป็นค่าเริ่มต้นแล้ว');
  };

  const renderTestButton = (
    label: string,
    apiType: 'balance' | 'transactions' | 'transfer',
    url: string,
    token: string,
    status: TestStatus,
    setStatus: (status: TestStatus) => void
  ) => {
    const isLoading = status.status === 'loading';
    const statusColor = 
      status.status === 'success' ? 'text-green-600' :
      status.status === 'error' ? 'text-red-600' :
      'text-muted-foreground';

    return (
      <div className="space-y-2">
        <button
          onClick={() => testConnection(apiType, url, token, setStatus)}
          disabled={isLoading || !url}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              กำลังทดสอบ...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              ทดสอบการเชื่อมต่อ
            </>
          )}
        </button>
        
        {status.message && (
          <div className={`flex items-center gap-2 text-sm ${statusColor}`}>
            {status.status === 'success' && <Check className="w-4 h-4" />}
            {status.status === 'error' && <X className="w-4 h-4" />}
            <span>{status.message}</span>
          </div>
        )}
      </div>
    );
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
                <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <span className="font-medium text-sm sm:text-base">{saveMessage.text}</span>
            </div>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Balance API */}
          <div className="border-2 border-primary/20 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="mb-3 sm:mb-4">
              <span className="text-sm sm:text-base font-bold text-foreground">Balance API</span>
              <span className="block text-xs text-muted-foreground mt-1">สำหรับดึงข้อมูลยอดเงินคงเหลือ</span>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  API URL
                </label>
                <input
                  type="text"
                  value={config.balanceApiUrl}
                  onChange={(e) => setConfig({ ...config, balanceApiUrl: e.target.value })}
                  placeholder="/functions/v1/true-wallet-balance"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary touch-manipulation"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  API Token
                  <span className="block sm:inline text-xs text-primary sm:ml-2 font-semibold mt-0.5 sm:mt-0">🔑 ระบุ Token สำหรับ Authorization</span>
                </label>
                <input
                  type="password"
                  value={config.balanceApiToken}
                  onChange={(e) => setConfig({ ...config, balanceApiToken: e.target.value })}
                  placeholder="Bearer Token (ถ้ามี)"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary bg-primary/5 touch-manipulation"
                />
              </div>
            </div>
            
            <div className="mt-4">
              {renderTestButton(
                'Balance API',
                'balance',
                config.balanceApiUrl,
                config.balanceApiToken,
                balanceStatus,
                setBalanceStatus
              )}
            </div>
          </div>

          {/* Transactions API */}
          <div className="border-2 border-primary/20 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="mb-3 sm:mb-4">
              <span className="text-sm sm:text-base font-bold text-foreground">Transactions API</span>
              <span className="block text-xs text-muted-foreground mt-1">สำหรับดึงข้อมูลรายการธุรกรรมล่าสุด</span>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  API URL
                </label>
                <input
                  type="text"
                  value={config.transactionsApiUrl}
                  onChange={(e) => setConfig({ ...config, transactionsApiUrl: e.target.value })}
                  placeholder="/functions/v1/true-wallet-transactions"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary touch-manipulation"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  API Token
                  <span className="block sm:inline text-xs text-primary sm:ml-2 font-semibold mt-0.5 sm:mt-0">🔑 ระบุ Token สำหรับ Authorization</span>
                </label>
                <input
                  type="password"
                  value={config.transactionsApiToken}
                  onChange={(e) => setConfig({ ...config, transactionsApiToken: e.target.value })}
                  placeholder="Bearer Token (ถ้ามี)"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary bg-primary/5 touch-manipulation"
                />
              </div>
            </div>
            
            <div className="mt-4">
              {renderTestButton(
                'Transactions API',
                'transactions',
                config.transactionsApiUrl,
                config.transactionsApiToken,
                transactionsStatus,
                setTransactionsStatus
              )}
            </div>
          </div>

          {/* Transfer Search API */}
          <div className="border-2 border-primary/20 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="mb-3 sm:mb-4">
              <span className="text-sm sm:text-base font-bold text-foreground">Transfer Search API</span>
              <span className="block text-xs text-muted-foreground mt-1">สำหรับค้นหาประวัติการโอนเงิน</span>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  API URL
                </label>
                <input
                  type="text"
                  value={config.transferSearchApiUrl}
                  onChange={(e) => setConfig({ ...config, transferSearchApiUrl: e.target.value })}
                  placeholder="/functions/v1/true-wallet-transfer-search"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary touch-manipulation"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  API Token
                  <span className="block sm:inline text-xs text-primary sm:ml-2 font-semibold mt-0.5 sm:mt-0">🔑 ระบุ Token สำหรับ Authorization</span>
                </label>
                <input
                  type="password"
                  value={config.transferSearchApiToken}
                  onChange={(e) => setConfig({ ...config, transferSearchApiToken: e.target.value })}
                  placeholder="Bearer Token (ถ้ามี)"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary bg-primary/5 touch-manipulation"
                />
              </div>
            </div>
            
            <div className="mt-4">
              {renderTestButton(
                'Transfer Search API',
                'transfer',
                config.transferSearchApiUrl,
                config.transferSearchApiToken,
                transferStatus,
                setTransferStatus
              )}
            </div>
          </div>

          {/* Telegram Bot Settings */}
          <div className="border-2 border-blue-200 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-transparent">
            <div className="mb-3 sm:mb-4">
              <span className="text-sm sm:text-base font-bold text-foreground">📱 Telegram Bot Settings</span>
              <span className="block text-xs text-muted-foreground mt-1">สำหรับส่งไฟล์ CSV ผ่าน Telegram Bot</span>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  Bot Token
                  <span className="block sm:inline text-xs text-blue-600 sm:ml-2 font-semibold mt-0.5 sm:mt-0">🔑 ระบุ Bot Token จาก @BotFather</span>
                </label>
                <input
                  type="password"
                  value={config.telegramBotToken}
                  onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                  placeholder="1234567890:AAEfr... (เริ่มต้นด้วยตัวเลข)"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-blue-50 touch-manipulation"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  Chat ID
                  <span className="block sm:inline text-xs text-blue-600 sm:ml-2 font-semibold mt-0.5 sm:mt-0">📧 รหัส Chat หรือ Group</span>
                </label>
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                  placeholder="-1001234567890 (Group) หรือ 123456789 (User)"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-blue-50 touch-manipulation"
                />
              </div>
            </div>
          </div>

          {/* LINE Notify Settings */}
          <div className="border-2 border-green-200 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-green-50 to-transparent">
            <div className="mb-3 sm:mb-4">
              <span className="text-sm sm:text-base font-bold text-foreground">💬 LINE Notify Settings</span>
              <span className="block text-xs text-muted-foreground mt-1">สำหรับส่งแจ้งเตือนผ่าน LINE Notify</span>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
                  Access Token
                  <span className="block sm:inline text-xs text-green-600 sm:ml-2 font-semibold mt-0.5 sm:mt-0">🔑 ระบุ Access Token จาก LINE Notify</span>
                </label>
                <input
                  type="password"
                  value={config.lineNotifyToken}
                  onChange={(e) => setConfig({ ...config, lineNotifyToken: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 bg-green-50 touch-manipulation"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-h-[44px] w-full sm:w-auto touch-manipulation"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">บันทึกการตั้งค่า</span>
          </button>

          <button
            onClick={loadConfig}
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
          <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1.5 sm:mb-2">คำแนะนำ</h3>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1 sm:space-y-1.5">
            <li className="leading-relaxed">• URL สามารถเป็น relative path เช่น /functions/v1/api-name หรือ absolute URL</li>
            <li className="leading-relaxed">• กดปุ่ม "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบว่า API ทำงานได้หรือไม่</li>
            <li className="leading-relaxed">• กดปุ่ม "บันทึกการตั้งค่า" เพื่อบันทึกการเปลี่ยนแปลง</li>
            <li className="leading-relaxed">• การตั้งค่าจะถูกบันทึกไว้ใน Browser localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
