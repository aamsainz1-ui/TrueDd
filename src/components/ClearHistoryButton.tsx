import React, { useState } from 'react';
import { Trash2, AlertTriangle, Eye, Search } from 'lucide-react';
import { clearHistoryService } from '../services/clearHistoryService';

interface ClearHistoryButtonProps {
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}

export function ClearHistoryButton({ searchTerm, onClear, className = '' }: ClearHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handlePreview = async () => {
    try {
      setIsLoading(true);
      console.log('Loading preview for delete...');
      
      const preview = await clearHistoryService.previewDeleteHistory(searchTerm);
      setPreviewData(preview);
      setTotalCount(preview.length);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to load preview:', error);
      alert('เกิดข้อผิดพลาดในการโหลดตัวอย่าง: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsLoading(true);
      console.log('Clearing transfer search history...');
      
      const result = await clearHistoryService.clearTransferSearchHistory(searchTerm);
      
      if (result.success) {
        alert(`ลบรายการสำเร็จแล้ว! ลบไป ${result.deletedCount} รายการ`);
        setIsOpen(false);
        setShowPreview(false);
        setConfirmClear(false);
        
        // Trigger refresh of transaction history
        const event = new CustomEvent('refresh-transaction-history', {
          detail: { 
            source: 'clearHistory',
            timestamp: new Date().toISOString(),
            deletedCount: result.deletedCount
          }
        });
        window.dispatchEvent(event);
        
        if (onClear) {
          onClear();
        }
      } else {
        alert('เกิดข้อผิดพลาดในการลบรายการ: ' + result.message);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('เกิดข้อผิดพลาดในการลบรายการ: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm ${className}`}
      >
        <Trash2 className="w-4 h-4" />
        <span>ลบประวัติค้นหา</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-xl font-bold">
                  ลบประวัติรายการจากการค้นหา
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowPreview(false);
                  setConfirmClear(false);
                }}
                className="text-white hover:bg-red-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      ⚠️ การลบรายการประวัติ
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      การลบรายการจะไม่สามารถย้อนกลับได้ กรุณาแน่ใจว่าต้องการลบรายการที่มี description "รับเงินจากการค้นหาโอนเงิน"
                    </p>
                  </div>
                </div>
              </div>

              {searchTerm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800">
                    <strong>จะลบเฉพาะรายการที่เกี่ยวข้องกับ:</strong> "{searchTerm}"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handlePreview}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isLoading ? 'กำลังโหลด...' : 'ดูตัวอย่างรายการ'}</span>
                </button>
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    ตัวอย่างรายการที่จะถูกลบ (แสดง {Math.min(previewData.length, 10)} รายการแรก)
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {previewData.length === 0 ? (
                      <p className="text-gray-600">ไม่พบรายการที่จะลบ</p>
                    ) : (
                      <div className="space-y-2">
                        {previewData.map((item, index) => (
                          <div key={index} className="bg-white rounded p-3 border text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.sender}</p>
                                <p className="text-gray-600">{item.description}</p>
                                <p className="text-xs text-gray-500">{item.datetime}</p>
                              </div>
                              <div className="text-red-600 font-bold">
                                -฿{item.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {totalCount > previewData.length && (
                          <p className="text-center text-gray-500 text-sm py-2">
                            ... และอีก {totalCount - previewData.length} รายการ
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-lg font-bold text-red-600">
                      จะลบทั้งหมด {totalCount} รายการ
                    </p>
                  </div>

                  {!confirmClear ? (
                    <button
                      onClick={() => setConfirmClear(true)}
                      disabled={totalCount === 0}
                      className="mt-4 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      ยืนยันการลบ ({totalCount} รายการ)
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 font-bold text-center">
                          ⚠️ การลบรายการจะไม่สามารถย้อนกลับได้!
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleClear}
                          disabled={isLoading}
                          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-bold"
                        >
                          {isLoading ? 'กำลังลบ...' : `ลบทันที (${totalCount} รายการ)`}
                        </button>
                        <button
                          onClick={() => setConfirmClear(false)}
                          disabled={isLoading}
                          className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}