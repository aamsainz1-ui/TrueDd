import React from 'react';
import { AlertTriangle, RefreshCw, Settings, ExternalLink } from 'lucide-react';

interface CORSErrorMessageProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export function CORSErrorMessage({ onRefresh, onOpenSettings }: CORSErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            🚨 ปัญหาการเชื่อมต่อ API
          </h3>
          
          <div className="space-y-3 text-sm text-red-700">
            <p>
              <strong>สาเหตุ:</strong> TrueMoney APIs ไม่อนุญาตให้เรียกจากเบราว์เซอร์โดยตรง (CORS Policy)
            </p>
            
            <p>
              <strong>ผลกระทบ:</strong> ข้อมูลยอดเงินและธุรกรรมไม่สามารถโหลดได้
            </p>
          </div>

          <div className="mt-4 bg-white rounded-lg p-4 border border-red-100">
            <h4 className="font-semibold text-red-800 mb-2">🔧 วิธีแก้ไข:</h4>
            
            <div className="space-y-2 text-sm text-red-700">
              <div className="flex items-start space-x-2">
                <span className="font-medium">1.</span>
                <div>
                  <span className="font-medium">Browser Extension (เร็วที่สุด):</span>
                  <ul className="ml-4 mt-1 space-y-1 list-disc">
                    <li><strong>Chrome:</strong> CORS Unblock Extension</li>
                    <li><strong>Firefox:</strong> CORS Everywhere</li>
                    <li><strong>Edge:</strong> CORS Unblock</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="font-medium">2.</span>
                <div>
                  <span className="font-medium">ตั้งค่า Proxy Server:</span>
                  <span> สำหรับการใช้งานระยะยาว</span>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="font-medium">3.</span>
                <div>
                  <span className="font-medium">ติดตั้ง Supabase Edge Functions:</span>
                  <span> แนะนำสำหรับ Production</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ลองใหม่</span>
            </button>
            
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>ตั้งค่า API</span>
            </button>
            
            <a
              href="https://nrzez3fbdilb.space.minimax.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิดใน Tab ใหม่</span>
            </a>
          </div>

          <div className="mt-4 text-xs text-red-600">
            <p className="flex items-center space-x-1">
              <span>💡</span>
              <span>หลังจากติดตั้ง Extension แล้ว กรุณารีเฟรชหน้าเว็บ</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data fallback component
export function MockDataFallback({ balance = 61897.90, transactions = [] }: {
  balance?: number;
  transactions?: any[];
}) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <h3 className="font-semibold text-yellow-800 mb-2">📊 ข้อมูลตัวอย่าง (Mock Data)</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p><strong>ยอดเงินตัวอย่าง:</strong> ฿{balance.toLocaleString()}</p>
        <p><strong>จำนวนธุรกรรม:</strong> {transactions.length} รายการ</p>
        <p className="text-xs mt-2">* ข้อมูลนี้เป็นเพียงตัวอย่าง โปรดแก้ไข CORS เพื่อดูข้อมูลจริง</p>
      </div>
    </div>
  );
}