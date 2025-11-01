import React, { useMemo, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface DailyIncomeData {
  date: string;
  dateLabel: string;
  dailyIncome: number;
  transactionCount: number;
}

export const BalanceTrendChart: React.FC = () => {
  const [chartData, setChartData] = useState<DailyIncomeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyIncomeData | null>(null);

  // ดึงข้อมูลสรุปยอดรับเงินรายวัน
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
        console.log('ข้อมูลที่ได้รับ:', result.data);
        setChartData(result.data);
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

  // สร้างช่วงวันที่ 7 วันล่าสุด (26 ต.ค. - 1 พ.ย. 2025)
  const generateLast7Days = (): string[] => {
    // ระบุวันที่แบบชัดเจนเพื่อให้แน่ใจว่าแสดงครบ 7 วัน
    const dates: string[] = [
      '2025-10-26', // 26 ตุลาคม 2025
      '2025-10-27', // 27 ตุลาคม 2025
      '2025-10-28', // 28 ตุลาคม 2025
      '2025-10-29', // 29 ตุลาคม 2025
      '2025-10-30', // 30 ตุลาคม 2025
      '2025-10-31', // 31 ตุลาคม 2025
      '2025-11-01'  // 1 พฤศจิกายน 2025 (วันปัจจุบัน)
    ];
    
    console.log('=== กราฟแสดง 7 วัน (26 ต.ค. - 1 พ.ย. 2025) ===');
    console.log('วันที่ทั้งหมด:', dates);
    console.log('จำนวนวัน:', dates.length);
    console.log('วันแรก:', dates[0], '| วันสุดท้าย:', dates[6]);
    console.log('==========================================');
    
    return dates;
  };

  // จับคู่ข้อมูลจาก API กับวันที่ และเติมค่า 0 ถ้าไม่มีข้อมูล
  const sortedChartData = useMemo(() => {
    const last7Days = generateLast7Days();
    
    console.log('=== BalanceTrendChart Data Processing ===');
    console.log('จำนวนข้อมูลจาก API:', chartData.length, 'วัน');
    console.log('วันที่ที่มีข้อมูลจาก API:', chartData.map(d => d.date));
    
    const completeData = last7Days.map((date, index) => {
      // หาข้อมูลจาก API สำหรับวันนี้
      const dataForDate = chartData.find(d => d.date === date);
      
      if (dataForDate) {
        console.log(`[${index + 1}/7] ${date}: มีข้อมูล - ฿${dataForDate.dailyIncome.toLocaleString()}, ${dataForDate.transactionCount} รายการ`);
        return dataForDate;
      } else {
        // ถ้าไม่มีข้อมูล ให้สร้างข้อมูลว่างๆ
        const dateObj = new Date(date + 'T00:00:00');
        const dateLabel = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        const isToday = date === '2025-11-01';
        console.log(`[${index + 1}/7] ${date}: ไม่มีข้อมูล - ใช้ค่า 0 (Label: ${dateLabel})${isToday ? ' [วันนี้]' : ''}`);
        return {
          date: date,
          dateLabel: dateLabel,
          dailyIncome: 0,
          transactionCount: 0
        };
      }
    });
    
    console.log('=== สรุปข้อมูลกราฟสมบูรณ์ (ต้องมี 7 จุด) ===');
    console.log('จำนวนจุดบนกราฟ:', completeData.length);
    completeData.forEach((d, idx) => {
      console.log(`${idx + 1}. ${d.dateLabel} (${d.date}): ฿${d.dailyIncome.toLocaleString()}, ${d.transactionCount} รายการ`);
    });
    console.log('================================================');
    
    return completeData;
  }, [chartData]);

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
        <h3 className="text-lg font-semibold text-foreground mb-4">แนวโน้มยอดรับเงินรายวัน (7 วันล่าสุด)</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !sortedChartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">แนวโน้มยอดรับเงินรายวัน (7 วันล่าสุด)</h3>
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
    const height = 280;
    const padding = 50;
    
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
            r="6"
            fill="#10b981"
            className="cursor-pointer transition-all hover:r-8"
            onClick={() => handlePointClick(data)}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx={x}
            cy={y}
            r="12"
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
        y={height - 10}
        textAnchor="middle"
        className="text-xs fill-muted-foreground"
      >
        {data.dateLabel}
      </text>
    ));
    
    // สร้างแกน y
    const yLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
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
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />
        
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          points={points}
          className="drop-shadow-sm"
        />
        
        {dots}
        {xLabels}
        {yLabels}
      </svg>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">แนวโน้มยอดรับเงินรายวัน (7 วันล่าสุด)</h3>
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
        
        <div className="w-full" style={{ minHeight: '200px' }}>
          {createSVGChart()}
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

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          {sortedChartData.slice(-3).map((data, index) => (
            <div key={index} className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">{data.dateLabel}</div>
              <div className="text-sm font-semibold text-green-600">
                ฿{Math.round(data.dailyIncome).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.transactionCount} รายการ
              </div>
            </div>
          ))}
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
                  ฿{(selectedDay.dailyIncome / selectedDay.transactionCount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
