import { useState, useEffect } from 'react';
import { Download, Calendar, FileText, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Toast } from './Toast';

interface ExportRecord {
  id: number;
  export_date: string;
  file_url: string;
  file_name: string;
  record_count: number;
  status: string;
  created_at: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function DailyExportSettings() {
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [toast, setToast] = useState<ToastState | null>(null);

  // ตั้งค่าวันที่เริ่มต้นเป็นเมื่อวาน
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
    fetchExportHistory();
  }, []);

  const fetchExportHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_exports')
        .select('*')
        .order('export_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setExportHistory(data || []);
    } catch (error) {
      console.error('Error fetching export history:', error);
      setToast({
        message: 'ไม่สามารถโหลดประวัติการส่งออกได้',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualExport = async () => {
    if (!selectedDate) {
      setToast({
        message: 'กรุณาเลือกวันที่ที่ต้องการส่งออก',
        type: 'error'
      });
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(
        'https://kmloseczqatswwczqajs.supabase.co/functions/v1/daily-export',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            export_date: selectedDate,
            auto_export: false,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setToast({
          message: result.message,
          type: 'success'
        });
        // รอ 1 วินาทีแล้วโหลดประวัติใหม่
        setTimeout(() => {
          fetchExportHistory();
        }, 1000);
      } else {
        throw new Error(result.error?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Export error:', error);
      setToast({
        message: error instanceof Error ? error.message : 'ไม่สามารถส่งออกข้อมูลได้',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      message: `กำลังดาวน์โหลด ${fileName}`,
      type: 'success'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 text-white">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
          <h1 className="text-xl sm:text-2xl font-bold">ส่งออกข้อมูลรายวัน</h1>
        </div>
        <p className="text-green-50 text-xs sm:text-sm">
          ส่งออกข้อมูลธุรกรรมเป็นไฟล์ CSV และดาวน์โหลดได้ทันที
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 text-xs sm:text-sm font-medium mb-1">
              ข้อมูลการส่งออกอัตโนมัติ
            </p>
            <p className="text-green-700 text-xs leading-relaxed">
              • ระบบจะส่งออกข้อมูลอัตโนมัติทุกวันเวลา 00:30 น.<br />
              • ข้อมูลที่ส่งออกจะเป็นของวันเมื่อวาน<br />
              • คุณสามารถส่งออกข้อมูลด้วยตนเองได้ตามวันที่ที่ต้องการ
            </p>
          </div>
        </div>
      </div>

      {/* Manual Export Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
          ส่งออกข้อมูลด้วยตนเอง
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
              เลือกวันที่
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 touch-manipulation"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleManualExport}
              disabled={isExporting || !selectedDate}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation min-h-[40px]"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังส่งออก...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ส่งออกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export History Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            ประวัติการส่งออก
          </h2>
          <button
            onClick={fetchExportHistory}
            disabled={isLoading}
            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
            title="รีเฟรช"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground text-xs sm:text-sm">กำลังโหลด...</p>
          </div>
        ) : exportHistory.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-xs sm:text-sm">ยังไม่มีประวัติการส่งออก</p>
            <p className="text-muted-foreground text-xs mt-1">ลองส่งออกข้อมูลด้วยตนเองเพื่อดูผลลัพธ์</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar-green">
            <div className="space-y-2 sm:space-y-3">
              {exportHistory.map((record) => (
                <div
                  key={record.id}
                  className="border border-border rounded-lg p-3 sm:p-4 hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {record.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                        )}
                        <h3 className="font-semibold text-foreground text-xs sm:text-sm truncate">
                          {formatDate(record.export_date)}
                        </h3>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p className="truncate">
                          <span className="font-medium">ไฟล์:</span> {record.file_name}
                        </p>
                        <p>
                          <span className="font-medium">จำนวน:</span> {record.record_count.toLocaleString()} รายการ
                        </p>
                        <p>
                          <span className="font-medium">สร้างเมื่อ:</span> {formatDateTime(record.created_at)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(record.file_url, record.file_name)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap shadow-sm hover:shadow-md touch-manipulation min-h-[36px] w-full sm:w-auto"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>ดาวน์โหลด</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
