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
    
    // สร้าง timestamp และ UUID เพื่อป้องกันชื่อไฟล์ซ้ำ
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const uuid = crypto.randomUUID().split('-')[0]; // ใช้ส่วนแรกของ UUID
    const fileName = `daily-transaction-${exportDate}_${timestamp}_${uuid}.csv`;

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

    // 5. ส่งอัตโนมัติไปยัง Telegram และ LINE (ถ้าตั้งค่าไว้)
    const autoSendResults = await performAutoSend(supabaseUrl, serviceKey, {
      fileUrl,
      fileName,
      exportDate,
      recordCount,
      autoExport
    });

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
          auto_send: autoSendResults
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

// ฟังก์ชันสำหรับส่งอัตโนมัติไปยัง Telegram และ LINE
async function performAutoSend(supabaseUrl: string, serviceKey: string, data: any) {
  try {
    console.log('📤 ตรวจสอบการตั้งค่าการส่งอัตโนมัติ...');

    // ดึงข้อมูลการตั้งค่าจาก export_settings table
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/export_settings?select=*&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!settingsResponse.ok) {
      console.log('⚠️ ไม่สามารถดึงข้อมูลการตั้งค่าได้');
      return { telegram: { sent: false }, line: { sent: false } };
    }

    const settings = await settingsResponse.json();
    const userSettings = settings[0]; // ใช้การตั้งค่าล่าสุด

    if (!userSettings) {
      console.log('ℹ️ ยังไม่มีการตั้งค่าการส่งอัตโนมัติ');
      return { telegram: { sent: false }, line: { sent: false } };
    }

    const results = {
      telegram: { sent: false, message: '' },
      line: { sent: false, message: '' }
    };

    // ส่งไปยัง Telegram (ถ้าเปิดใช้งาน)
    if (userSettings.send_to_telegram && userSettings.telegram_bot_token && userSettings.telegram_chat_id) {
      try {
        const telegramResponse = await fetch(`${supabaseUrl}/functions/v1/send-to-telegram`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegramBotToken: userSettings.telegram_bot_token,
            telegramChatId: userSettings.telegram_chat_id,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            message: `📊 รายงานประจำวัน True Wallet Dashboard\n\n📅 วันที่: ${data.exportDate}\n📋 จำนวนรายการ: ${data.recordCount} รายการ\n\n⏰ ส่งออกอัตโนมัติ: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`
          }),
        });

        if (telegramResponse.ok) {
          results.telegram.sent = true;
          results.telegram.message = 'ส่งไปยัง Telegram สำเร็จ';
          console.log('✅ ส่งไฟล์ไปยัง Telegram สำเร็จ');
        } else {
          const error = await telegramResponse.json();
          results.telegram.message = `ส่งไปยัง Telegram ล้มเหลว: ${error.error?.message || 'Unknown error'}`;
          console.error('❌ ส่งไปยัง Telegram ล้มเหลว:', error);
        }
      } catch (error) {
        results.telegram.message = `ส่งไปยัง Telegram ล้มเหลว: ${error.message}`;
        console.error('❌ ส่งไปยัง Telegram ล้มเหลว:', error);
      }
    }

    // ส่งไปยัง LINE (ถ้าเปิดใช้งาน)
    if (userSettings.send_to_line && userSettings.line_notify_token) {
      try {
        const lineResponse = await fetch(`${supabaseUrl}/functions/v1/send-to-line`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lineNotifyToken: userSettings.line_notify_token,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            exportDate: data.exportDate,
            recordCount: data.recordCount,
          }),
        });

        if (lineResponse.ok) {
          results.line.sent = true;
          results.line.message = 'ส่งไปยัง LINE สำเร็จ';
          console.log('✅ ส่งข้อความไปยัง LINE สำเร็จ');
        } else {
          const error = await lineResponse.json();
          results.line.message = `ส่งไปยัง LINE ล้มเหลว: ${error.error?.message || 'Unknown error'}`;
          console.error('❌ ส่งไปยัง LINE ล้มเหลว:', error);
        }
      } catch (error) {
        results.line.message = `ส่งไปยัง LINE ล้มเหลว: ${error.message}`;
        console.error('❌ ส่งไปยัง LINE ล้มเหลว:', error);
      }
    }

    console.log('📤 การส่งอัตโนมัติเสร็จสิ้น:', results);
    return results;

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการส่งอัตโนมัติ:', error);
    return { telegram: { sent: false, message: error.message }, line: { sent: false, message: error.message } };
  }
}
