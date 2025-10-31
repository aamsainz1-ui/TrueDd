// Edge Function สำหรับดึงข้อมูลสรุปยอดรับเงินรายวัน
// ใช้ข้อมูลจาก transaction_history table โดยตรง

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // คำนวณวันที่เริ่มต้น (7 วันย้อนหลัง)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6); // 6 วันย้อนหลัง = รวม 7 วัน

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = today.toISOString().split('T')[0];

    console.log(`Fetching daily income summary from ${startDateStr} to ${endDateStr}`);

    // ดึงข้อมูลสรุปยอดรับเงินรายวัน
    const summaryResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_daily_income_summary`,
      {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDateStr,
          end_date: endDateStr
        }),
      }
    );

    let summaryData = [];

    if (!summaryResponse.ok) {
      // ถ้า RPC function ไม่มี ให้ใช้ SQL query โดยตรง
      console.log('RPC function not found, using direct SQL query');
      
      const queryResponse = await fetch(
        `${supabaseUrl}/rest/v1/transaction_history?transaction_date=gte.${startDateStr}&transaction_date=lte.${endDateStr}&select=transaction_date,amount,description&order=transaction_date.asc`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!queryResponse.ok) {
        throw new Error(`Failed to fetch transaction history: ${queryResponse.statusText}`);
      }

      const transactions = await queryResponse.json();
      
      // จัดกลุ่มข้อมูลตามวัน
      const dailyData = new Map();
      
      transactions.forEach((tx: any) => {
        const date = tx.transaction_date;
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date,
            totalIncome: 0,
            transactionCount: 0,
            transactions: []
          });
        }
        
        const dayData = dailyData.get(date);
        dayData.totalIncome += parseFloat(tx.amount);
        dayData.transactionCount += 1;
        dayData.transactions.push(tx);
      });

      // สร้างข้อมูลครบ 7 วัน (รวมวันที่ไม่มีข้อมูล)
      const result = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = dailyData.get(dateStr) || {
          date: dateStr,
          totalIncome: 0,
          transactionCount: 0,
          transactions: []
        };

        result.push({
          date: dateStr,
          dateLabel: date.toLocaleDateString('th-TH', {
            month: 'short',
            day: 'numeric'
          }),
          dailyIncome: dayData.totalIncome,
          transactionCount: dayData.transactionCount
        });
      }
      
      summaryData = result;
    } else {
      summaryData = await summaryResponse.json();
    }

    console.log(`Found summary data for ${summaryData.length} days`);

    return new Response(
      JSON.stringify({
        success: true,
        data: summaryData,
        summary: {
          totalDays: summaryData.length,
          totalIncome: summaryData.reduce((sum: number, day: any) => sum + day.dailyIncome, 0),
          averageDailyIncome: summaryData.length > 0 ? 
            summaryData.reduce((sum: number, day: any) => sum + day.dailyIncome, 0) / summaryData.length : 0
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Daily income summary error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'SUMMARY_ERROR',
          message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปยอดรับเงินรายวัน',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
