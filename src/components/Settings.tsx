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

interface SaveMessage {
  type: 'success' | 'error';
  message: string;
}

const defaultConfig: APIConfig = {
  balanceApiUrl: '',
  balanceApiToken: '',
  transactionsApiUrl: '',
  transactionsApiToken: '',
  transferSearchApiUrl: '',
  transferSearchApiToken: '',
  telegramBotToken: '',
  telegramChatId: '',
  lineNotifyToken: ''
};

const defaultBalances = {
  balanceApiUrl: 'https://example.com/api/balance',
  balanceApiToken: 'your-api-token-here',
  transactionsApiUrl: 'https://example.com/api/transactions', 
  transactionsApiToken: 'your-api-token-here',
  transferSearchApiUrl: 'https://example.com/api/search',
  transferSearchApiToken: 'your-api-token-here'
};

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<APIConfig>(defaultConfig);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
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

  const saveConfig = () => {
    setIsLoading(true);
    try {
      localStorage.setItem('walletConfig', JSON.stringify(config));
      setSaveMessage({ type: 'success', message: 'บันทึกการตั้งค่าสำเร็จ' });
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof APIConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefault = () => {
    setConfig(defaultBalances as APIConfig);
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

        {/* API Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">การตั้งค่า API</h3>
          <div className="grid gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Balance API URL
                </label>
                <input
                  type="url"
                  value={config.balanceApiUrl}
                  onChange={(e) => handleInputChange('balanceApiUrl', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="https://api.example.com/balance"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Balance API Token
                </label>
                <input
                  type="password"
                  value={config.balanceApiToken}
                  onChange={(e) => handleInputChange('balanceApiToken', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="your-api-token"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Transactions API URL
                </label>
                <input
                  type="url"
                  value={config.transactionsApiUrl}
                  onChange={(e) => handleInputChange('transactionsApiUrl', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="https://api.example.com/transactions"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Transactions API Token
                </label>
                <input
                  type="password"
                  value={config.transactionsApiToken}
                  onChange={(e) => handleInputChange('transactionsApiToken', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="your-api-token"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Transfer Search API URL
                </label>
                <input
                  type="url"
                  value={config.transferSearchApiUrl}
                  onChange={(e) => handleInputChange('transferSearchApiUrl', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="https://api.example.com/search"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  Transfer Search API Token
                </label>
                <input
                  type="password"
                  value={config.transferSearchApiToken}
                  onChange={(e) => handleInputChange('transferSearchApiToken', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="your-api-token"
                />
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