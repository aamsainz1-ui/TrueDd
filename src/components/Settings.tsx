import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Check, X, RefreshCw, Save, Download } from 'lucide-react';

interface APIConfig {
  balanceApiUrl: string;
  transactionsApiUrl: string;
  transferSearchApiUrl: string;
}

interface TestStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const DEFAULT_CONFIG: APIConfig = {
  balanceApiUrl: '/functions/v1/true-wallet-balance',
  transactionsApiUrl: '/functions/v1/true-wallet-transactions',
  transferSearchApiUrl: '/functions/v1/true-wallet-transfer-search',
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
    setStatus: (status: TestStatus) => void
  ) => {
    setStatus({ status: 'loading', message: 'กำลังทดสอบ...' });

    try {
      // Get Supabase config from service
      const supabaseUrl = 'https://kmloseczqatswwczqajs.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I';

      const fullUrl = url.startsWith('http') ? url : `${supabaseUrl}${url}`;

      let response;
      if (apiType === 'transfer') {
        // Transfer search requires POST with body
        response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: '0000000000' }) // Test with dummy phone
        });
      } else {
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
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
          onClick={() => testConnection(apiType, url, setStatus)}
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
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">การตั้งค่า API</h2>
            <p className="text-sm text-muted-foreground">จัดการ API Endpoints สำหรับเชื่อมต่อกับ True Wallet</p>
          </div>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {saveMessage.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Balance API */}
          <div className="border border-border rounded-lg p-4">
            <label className="block mb-2">
              <span className="text-sm font-semibold text-foreground">Balance API</span>
              <span className="text-xs text-muted-foreground ml-2">สำหรับดึงข้อมูลยอดเงินคงเหลือ</span>
            </label>
            <input
              type="text"
              value={config.balanceApiUrl}
              onChange={(e) => setConfig({ ...config, balanceApiUrl: e.target.value })}
              placeholder="/functions/v1/true-wallet-balance"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
            />
            {renderTestButton(
              'Balance API',
              'balance',
              config.balanceApiUrl,
              balanceStatus,
              setBalanceStatus
            )}
          </div>

          {/* Transactions API */}
          <div className="border border-border rounded-lg p-4">
            <label className="block mb-2">
              <span className="text-sm font-semibold text-foreground">Transactions API</span>
              <span className="text-xs text-muted-foreground ml-2">สำหรับดึงข้อมูลรายการธุรกรรมล่าสุด</span>
            </label>
            <input
              type="text"
              value={config.transactionsApiUrl}
              onChange={(e) => setConfig({ ...config, transactionsApiUrl: e.target.value })}
              placeholder="/functions/v1/true-wallet-transactions"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
            />
            {renderTestButton(
              'Transactions API',
              'transactions',
              config.transactionsApiUrl,
              transactionsStatus,
              setTransactionsStatus
            )}
          </div>

          {/* Transfer Search API */}
          <div className="border border-border rounded-lg p-4">
            <label className="block mb-2">
              <span className="text-sm font-semibold text-foreground">Transfer Search API</span>
              <span className="text-xs text-muted-foreground ml-2">สำหรับค้นหาประวัติการโอนเงิน</span>
            </label>
            <input
              type="text"
              value={config.transferSearchApiUrl}
              onChange={(e) => setConfig({ ...config, transferSearchApiUrl: e.target.value })}
              placeholder="/functions/v1/true-wallet-transfer-search"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
            />
            {renderTestButton(
              'Transfer Search API',
              'transfer',
              config.transferSearchApiUrl,
              transferStatus,
              setTransferStatus
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-5 h-5" />
            บันทึกการตั้งค่า
          </button>

          <button
            onClick={loadConfig}
            className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            โหลดการตั้งค่า
          </button>

          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            รีเซ็ตเป็นค่าเริ่มต้น
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">คำแนะนำ</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• URL สามารถเป็น relative path เช่น /functions/v1/api-name หรือ absolute URL</li>
            <li>• กดปุ่ม "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบว่า API ทำงานได้หรือไม่</li>
            <li>• กดปุ่ม "บันทึกการตั้งค่า" เพื่อบันทึกการเปลี่ยนแปลง</li>
            <li>• การตั้งค่าจะถูกบันทึกไว้ใน Browser localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
