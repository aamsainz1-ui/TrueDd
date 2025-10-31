import React, { useMemo, useEffect, useState } from 'react';

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

  // ดึงข้อมูลสรุปยอดรับเงินรายวัน
  const fetchDailyIncomeData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 เริ่มดึงข้อมูล daily income...');
      
      const response = await fetch(
        'https://kmloseczqatswwczqajs.supabase.co/functions/v1/daily-income-summary',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I'
          }
        }
      );

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (result.success) {
        console.log('✅ ข้อมูลที่ได้รับ:', result.data);
        setChartData(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('❌ Error fetching daily income summary:', error);
      setError(`ไม่สามารถโหลดข้อมูลได้: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyIncomeData();
  }, []);

  // เรียงข้อมูลใหม่ให้เป็น 7 วันล่าสุด
  const sortedChartData = useMemo(() => {
    return chartData.slice(-7);
  }, [chartData]);

  if (isLoading) {
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
    const height = 250;
    const padding = 40;
    
    const dailyIncomes = sortedChartData.map(d => d.dailyIncome);
    const minIncome = Math.min(...dailyIncomes, 0);
    const maxIncome = Math.max(...dailyIncomes, 1000); // อย่างน้อย 1000
    
    const xStep = (width - 2 * padding) / (sortedChartData.length - 1);
    const yScale = (height - 2 * padding) / (maxIncome - minIncome || 1);
    
    // สร้างจุดของกราฟ
    const points = sortedChartData.map((data, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (data.dailyIncome - minIncome) * yScale;
      return `${x},${y}`;
    }).join(' ');
    
    // สร้างจุด dots
    const dots = sortedChartData.map((data, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (data.dailyIncome - minIncome) * yScale;
      return (
        <circle
          key={index}
          cx={x}
          cy={y}
          r="4"
          fill="#10b981"
          className="hover:r-6 transition-all cursor-pointer"
        >
          <title>{`${data.dateLabel}: ฿${Math.round(data.dailyIncome).toLocaleString()} (${data.transactionCount} รายการ)`}</title>
        </circle>
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
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* แกน y */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
        {/* แกน x */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />
        
        {/* เส้นกราฟ */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          points={points}
          className="drop-shadow-sm"
        />
        
        {/* จุด */}
        {dots}
        
        {/* ป้ายแกน x */}
        {xLabels}
        
        {/* ป้ายแกน y */}
        {yLabels}
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">แนวโน้มยอดรับเงินรายวัน (7 วันล่าสุด)</h3>
        <div className="text-xs text-muted-foreground">
          อัปเดต: {new Date().toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      <div className="h-64 w-full overflow-x-auto">
        {createSVGChart()}
      </div>

      {/* Legend สำหรับแสดงคำอธิบาย */}
      <div className="flex justify-center mt-4 space-x-6 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-muted-foreground">ยอดรับเงินรายวัน</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-muted-foreground">รายการรับเงิน</span>
        </div>
      </div>

      {/* สรุปข้อมูลรายวัน */}
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
  );
};