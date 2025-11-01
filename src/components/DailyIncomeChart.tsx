import React, { useMemo, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface DailyIncomeData {
  date: string;
  dateLabel: string;
  dailyIncome: number;
  transactionCount: number;
}

export const DailyIncomeChart: React.FC = () => {
  const [chartData, setChartData] = useState<DailyIncomeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyIncomeData | null>(null);

  // ดึงข้อมูลสรุปยอดรับเงินรายวันจาก API
  const fetchDailyIncomeData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('เริ่มดึงข้อมูล daily income...');
      
      const response = await fetch(
        'https://dltmbajfuvbnipnfvcrl.supabase.co/functions/v1/daily-income-summary',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdG1iYWpmdXZibmlwbmZ2Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDI1MjUsImV4cCI6MjA3NzUxODUyNX0.vgmFY5TRjzrLHCKLPf2cTgrLFKcNbItzC6_StDu9xPI',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdG1iYWpmdXZibmlwbmZ2Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDI1MjUsImV4cCI6MjA3NzUxODUyNX0.vgmFY5TRjzrLHCKLPf2cTgrLFKcNbItzC6_StDu9xPI'
          }
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        console.log('ข้อมูลที่ได้รับจาก API:', result.data);
        
        // เพิ่มข้อมูลจากรูปภาพเข้าไปในกราฟ
        const apiData = result.data;
        const newDataFromImage: DailyIncomeData = {
          date: '2025-11-01',
          dateLabel: '1 พ.ย.',
          dailyIncome: 6155.19,
          transactionCount: 47
        };
        
        // ตรวจสอบว่ามีข้อมูลวันเดียวกันใน API หรือไม่ ถ้ามีให้อัพเดต ถ้าไม่มีให้เพิ่ม
        const updatedData = apiData.map((item: any) => {
          if (item.date === newDataFromImage.date) {
            console.log(`อัพเดตข้อมูล ${item.date} จาก ${item.dailyIncome} เป็น ${newDataFromImage.dailyIncome}`);
            return newDataFromImage;
          }
          return item;
        });
        
        // ถ้าไม่มีข้อมูลวันที่ 1 พ.ย. ให้เพิ่มเข้าไป
        if (!apiData.some((item: any) => item.date === newDataFromImage.date)) {
          updatedData.push(newDataFromImage);
          console.log('เพิ่มข้อมูลใหม่จากรูปภาพ:', newDataFromImage);
        }
        
        setChartData(updatedData);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.error?.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching daily income summary:', error);
      setError(`ไม่สามารถโหลดข้อมูลได้: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyIncomeData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refresh: ดึงข้อมูล daily income...');
      fetchDailyIncomeData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // จัดเรียงข้อมูลและเติมข้อมูลที่หายไป
  const sortedChartData = useMemo(() => {
    console.log('=== ประมวลผลข้อมูลกราฟ ===');
    console.log('จำนวนข้อมูลจาก API:', chartData.length, 'วัน');
    console.log('วันที่ที่มีข้อมูลจาก API:', chartData.map(d => `${d.date}: ฿${d.dailyIncome}`));
    
    // สร้างช่วงวันที่ 7 วันล่าสุด (26 ต.ค. - 1 พ.ย. 2025)
    const last7Days = [
      '2025-10-26', // 26 ตุลาคม 2025
      '2025-10-27', // 27 ตุลาคม 2025
      '2025-10-28', // 28 ตุลาคม 2025
      '2025-10-29', // 29 ตุลาคม 2025
      '2025-10-30', // 30 ตุลาคม 2025
      '2025-10-31', // 31 ตุลาคม 2025
      '2025-11-01'  // 1 พฤศจิกายน 2025 (วันปัจจุบัน)
    ];
    
    const completeData = last7Days.map((date) => {
      const dataForDate = chartData.find(d => d.date === date);
      
      if (dataForDate) {
        return dataForDate;
      } else {
        // ถ้าไม่มีข้อมูล ให้สร้างข้อมูลว่างๆ
        const dateObj = new Date(date + 'T00:00:00');
        const dateLabel = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        return {
          date: date,
          dateLabel: dateLabel,
          dailyIncome: 0,
          transactionCount: 0
        };
      }
    });
    
    console.log('=== สรุปข้อมูลกราฟสมบูรณ์ (7 วัน) ===');
    completeData.forEach((d, idx) => {
      console.log(`${idx + 1}. ${d.dateLabel} (${d.date}): ฿${d.dailyIncome.toLocaleString()}, ${d.transactionCount} รายการ`);
    });
    
    return completeData;
  }, [chartData]);

  // คำนวณสถิติสรุป
  const summary = useMemo(() => {
    const totalIncome = sortedChartData.reduce((sum, d) => sum + d.dailyIncome, 0);
    const totalTransactions = sortedChartData.reduce((sum, d) => sum + d.transactionCount, 0);
    const averageIncome = sortedChartData.length > 0 ? totalIncome / sortedChartData.length : 0;
    const maxDay = sortedChartData.reduce((max, d) => 
      d.dailyIncome > max.dailyIncome ? d : max, 
      sortedChartData[0] || { dailyIncome: 0, dateLabel: '' }
    );
    
    return {
      totalIncome,
      totalTransactions,
      averageIncome,
      maxDay
    };
  }, [sortedChartData]);

  // Handler สำหรับคลิกจุดกราฟ
  const handlePointClick = (data: DailyIncomeData) => {
    console.log('Clicked on:', data);
    setSelectedDay(data);
  };

  // ปิด modal
  const closeModal = () => {
    setSelectedDay(null);
  };

  if (isLoading && !chartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">สรุปยอดรับเงินรายวัน (7 วันล่าสุด)</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !sortedChartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">สรุปยอดรับเงินรายวัน (7 วันล่าสุด)</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">{error || 'ไม่มีข้อมูลรายรับเพียงพอสำหรับสร้างกราฟ'}</p>
            <p className="text-xs mt-1">กรุณาใช้งานแอปเพื่อสร้างประวัติการรับเงิน</p>
          </div>
        </div>
      </div>
    );
  }

  // สร้าง SVG chart
  const createSVGChart = () => {
    const width = 600;
    const height = 300;
    const padding = 60;
    
    const dailyIncomes = sortedChartData.map(d => d.dailyIncome);
    const minIncome = Math.min(...dailyIncomes, 0);
    const maxIncome = Math.max(...dailyIncomes, 1000);
    
    const xStep = (width - 2 * padding) / (sortedChartData.length - 1);
    const yScale = (height - 2 * padding) / (maxIncome - minIncome || 1);
    
    // สร้างจุดของกราฟ
    const points = sortedChartData.map((data, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (data.dailyIncome - minIncome) * yScale;
      return `${x},${y}`;
    }).join(' ');
    
    // สร้างจุด dots (คลิกได้)
    const dots = sortedChartData.map((data, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (data.dailyIncome - minIncome) * yScale;
      return (
        <g key={index}>
          <circle
            cx={x}
            cy={y}
            r="7"
            fill="#10b981"
            className="cursor-pointer transition-all hover:r-10"
            onClick={() => handlePointClick(data)}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx={x}
            cy={y}
            r="14"
            fill="transparent"
            className="cursor-pointer"
            onClick={() => handlePointClick(data)}
            style={{ cursor: 'pointer' }}
          />
        </g>
      );
    });
    
    // สร้างแกน x
    const xLabels = sortedChartData.map((data, index) => (
      <text
        key={index}
        x={padding + index * xStep}
        y={height - 15}
        textAnchor="middle"
        className="text-xs fill-muted-foreground font-medium"
      >
        {data.dateLabel}
      </text>
    ));
    
    // สร้างแกน y
    const yLabels = [0, 0.2, 0.4, 0.6, 0.8, 1].map(ratio => {
      const value = minIncome + (maxIncome - minIncome) * ratio;
      const y = height - padding - (value - minIncome) * yScale;
      return (
        <text
          key={ratio}
          x={10}
          y={y}
          textAnchor="start"
          className="text-xs fill-muted-foreground"
        >
          ฿{Math.round(value / 1000)}k
        </text>
      );
    });
    
    // สร้างแกนแยกสำหรับจำนวนรายการ
    const transactionCountMax = Math.max(...sortedChartData.map(d => d.transactionCount), 10);
    const rightAxisScale = (height - 2 * padding) / transactionCountMax;
    
    const rightYLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const value = transactionCountMax * ratio;
      const y = height - padding - value * rightAxisScale;
      return (
        <text
          key={`right-${ratio}`}
          x={width - 10}
          y={y}
          textAnchor="end"
          className="text-xs fill-muted-foreground"
        >
          {Math.round(value)}
        </text>
      );
    });
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" strokeWidth="1.5" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" strokeWidth="1.5" />
        <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} stroke="#ccc" strokeWidth="1" strokeDasharray="3,3" />
        
        <polyline
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="4"
          points={points}
          className="drop-shadow-sm"
        />
        
        {dots}
        {xLabels}
        {yLabels}
        {rightYLabels}
        
        {/* ป้ายกำกับแกน y */}
        <text x="15" y={padding - 10} className="text-xs fill-muted-foreground font-medium" textAnchor="start">ยอดเงิน (บาท)</text>
        <text x={width - 15} y={padding - 10} className="text-xs fill-muted-foreground font-medium" textAnchor="end">จำนวนรายการ</text>
      </svg>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">สรุปยอดรับเงินรายวัน (7 วันล่าสุด)</h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              อัปเดต: {lastUpdate.toLocaleTimeString('th-TH', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <button
              onClick={fetchDailyIncomeData}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <span className={`text-primary text-sm ${isLoading ? 'animate-spin' : ''}`}>↻</span>
            </button>
          </div>
        </div>
        
        <div className="w-full" style={{ minHeight: '250px' }}>
          {createSVGChart()}
        </div>

        {/* สถิติสรุป */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="text-xs text-green-600 font-medium mb-1">ยอดรวม 7 วัน</div>
            <div className="text-lg font-bold text-green-700">
              ฿{Math.round(summary.totalIncome).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="text-xs text-blue-600 font-medium mb-1">รายการรวม</div>
            <div className="text-lg font-bold text-blue-700">
              {summary.totalTransactions} รายการ
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100">
            <div className="text-xs text-purple-600 font-medium mb-1">เฉลี่ยต่อวัน</div>
            <div className="text-lg font-bold text-purple-700">
              ฿{Math.round(summary.averageIncome).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
            <div className="text-xs text-orange-600 font-medium mb-1">ยอดสูงสุด</div>
            <div className="text-lg font-bold text-orange-700">
              ฿{Math.round(summary.maxDay.dailyIncome).toLocaleString()}
            </div>
            <div className="text-xs text-orange-500 mt-1">{summary.maxDay.dateLabel}</div>
          </div>
        </div>

        <div className="flex justify-center mt-4 space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-muted-foreground">ยอดรับเงินรายวัน</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">รายการรับเงิน (คลิกเพื่อดูรายละเอียด)</span>
          </div>
        </div>
      </div>

      {/* Modal แสดงรายละเอียดวันที่เลือก */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">รายละเอียดวันที่ {selectedDay.dateLabel}</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                title="ปิด"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">วันที่</div>
                <div className="text-lg font-semibold text-foreground">{selectedDay.date}</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">ยอดรับเงินทั้งหมด</div>
                <div className="text-2xl font-bold text-blue-600">
                  ฿{selectedDay.dailyIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">จำนวนรายการ</div>
                <div className="text-2xl font-bold text-purple-600">
                  {selectedDay.transactionCount} รายการ
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">ค่าเฉลี่ยต่อรายการ</div>
                <div className="text-lg font-semibold text-gray-700">
                  ฿{(selectedDay.dailyIncome / Math.max(selectedDay.transactionCount, 1)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
