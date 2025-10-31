// Edge Function สำหรับส่งออกข้อมูลธุรกรรมรายวันแบบอัตโนมัติ
// รองรับการเรียกใช้จาก HTTP request และ Cron Job

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

    // รับ parameters จาก request body (ถ้ามี) หรือใช้ค่า default
    let exportDate: string;
    let autoExport = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        exportDate = body.export_date || getYesterday();
        autoExport = body.auto_export || false;
      } catch {
        // ถ้า parse body ไม่ได้ (เช่นเรียกจาก Cron) ใช้ค่า default
        exportDate = getYesterday();
        autoExport = true;
      }
    } else {
      exportDate = getYesterday();
    }

    console.log(`Starting daily export for date: ${exportDate}`);

    // 1. ดึงข้อมูล transaction_history จาก Supabase
    const transactionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/transaction_history?created_at=gte.${exportDate}T00:00:00&created_at=lt.${getNextDay(exportDate)}T00:00:00&order=created_at.desc`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!transactionsResponse.ok) {
      throw new Error(`Failed to fetch transactions: ${transactionsResponse.statusText}`);
    }

    const transactions = await transactionsResponse.json();
    const recordCount = transactions.length;

    console.log(`Found ${recordCount} transactions for ${exportDate}`);

    if (recordCount === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `ไม่มีข้อมูลธุรกรรมสำหรับวันที่ ${exportDate}`,
          export_date: exportDate,
          record_count: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. สร้างไฟล์ CSV
    const csvContent = generateCSV(transactions);
    const fileName = `daily-transaction-${exportDate}.csv`;

    // 3. อัปโหลดไฟล์ไปที่ Storage bucket "daily-exports"
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/daily-exports/${fileName}`,
      {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'text/csv',
        },
        body: csvContent,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload file: ${errorText}`);
    }

    const fileUrl = `${supabaseUrl}/storage/v1/object/public/daily-exports/${fileName}`;

    // 4. บันทึก record ใน daily_exports table
    const exportRecord = {
      export_date: exportDate,
      file_url: fileUrl,
      file_name: fileName,
      record_count: recordCount,
      status: 'completed',
    };

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/daily_exports`,
      {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(exportRecord),
      }
    );

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error(`Failed to insert export record: ${errorText}`);
      // ไม่ throw error เพราะไฟล์อัปโหลดสำเร็จแล้ว
    }

    console.log(`Export completed successfully: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `ส่งออกข้อมูลสำเร็จ: ${recordCount} รายการ`,
        data: {
          export_date: exportDate,
          file_url: fileUrl,
          file_name: fileName,
          record_count: recordCount,
          auto_export: autoExport,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Export error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูล',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ฟังก์ชันสำหรับแปลง array of objects เป็น CSV
function generateCSV(data: any[]): string {
  if (data.length === 0) return '';

  // กำหนด columns ที่ต้องการส่งออก
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'transaction_date', label: 'วันที่ธุรกรรม' },
    { key: 'transaction_time', label: 'เวลา' },
    { key: 'type', label: 'ประเภท' },
    { key: 'description', label: 'รายละเอียด' },
    { key: 'amount', label: 'จำนวนเงิน' },
    { key: 'balance', label: 'ยอดคงเหลือ' },
    { key: 'category', label: 'หมวดหมู่' },
    { key: 'source', label: 'แหล่งที่มา' },
    { key: 'created_at', label: 'วันที่สร้าง' },
  ];

  // สร้าง header row
  const header = columns.map(col => escapeCSV(col.label)).join(',');

  // สร้าง data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      return escapeCSV(value != null ? String(value) : '');
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

// ฟังก์ชันสำหรับ escape ค่าใน CSV (จัดการ comma, quotes, newlines)
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ฟังก์ชันสำหรับหาวันเมื่อวาน (YYYY-MM-DD format)
function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

// ฟังก์ชันสำหรับหาวันถัดไป
function getNextDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}

// ฟังก์ชันสำหรับ format date เป็น YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
