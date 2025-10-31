// Edge Function สำหรับดึงประวัติรายการรับเงินพร้อมสรุปยอดรายวัน

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

    // Parse query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const phoneNumber = url.searchParams.get('phoneNumber');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    console.log('Get transaction history with filters:', { startDate, endDate, phoneNumber, limit });

    // Build query conditions
    let queryConditions = [];
    let queryParams: any[] = [];

    if (startDate) {
      queryConditions.push('transaction_date >= $' + (queryParams.length + 1));
      queryParams.push(startDate);
    }

    if (endDate) {
      queryConditions.push('transaction_date <= $' + (queryParams.length + 1));
      queryParams.push(endDate);
    }

    if (phoneNumber) {
      queryConditions.push('phone_number ILIKE $' + (queryParams.length + 1));
      queryParams.push(`%${phoneNumber}%`);
    }

    const whereClause = queryConditions.length > 0 ? 'WHERE ' + queryConditions.join(' AND ') : '';

    // Get transactions with filters
    const transactionsQuery = `
      SELECT * FROM transaction_history 
      ${whereClause}
      ORDER BY transaction_date DESC, transaction_time DESC 
      LIMIT $${queryParams.length + 1}
    `;
    
    queryParams.push(limit);

    console.log('Executing transactions query:', transactionsQuery);
    console.log('Query params:', queryParams);

    const transactionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: transactionsQuery,
          params: queryParams
        }),
      }
    );

    if (!transactionsResponse.ok) {
      // Fallback to direct table query if RPC fails
      console.log('RPC failed, using direct table query');
      
      let directUrl = `${supabaseUrl}/rest/v1/transaction_history?select=*`;
      
      if (startDate) directUrl += `&transaction_date=gte.${startDate}`;
      if (endDate) directUrl += `&transaction_date=lte.${endDate}`;
      if (phoneNumber) directUrl += `&phone_number=ilike.%${phoneNumber}%`;
      
      directUrl += `&order=transaction_date.desc,transaction_time.desc&limit=${limit}`;

      const directResponse = await fetch(directUrl, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!directResponse.ok) {
        throw new Error(`Failed to fetch transactions: ${directResponse.statusText}`);
      }

      var transactions = await directResponse.json();
    } else {
      const result = await transactionsResponse.json();
      transactions = result.data || result;
    }

    console.log(`Found ${transactions.length} transactions`);

    // Calculate summary
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum: number, tx: any) => {
      return sum + parseFloat(tx.amount || 0);
    }, 0);

    // Calculate daily totals
    const dailyTotalsMap = new Map();
    
    transactions.forEach((tx: any) => {
      const date = tx.transaction_date;
      if (!dailyTotalsMap.has(date)) {
        dailyTotalsMap.set(date, { date, total: 0, count: 0 });
      }
      
      const dayData = dailyTotalsMap.get(date);
      dayData.total += parseFloat(tx.amount || 0);
      dayData.count += 1;
    });

    // Convert to array and sort by date (newest first)
    const dailyTotals = Array.from(dailyTotalsMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10); // Show last 10 days with data

    console.log('Daily totals calculated:', dailyTotals);

    const summary = {
      totalTransactions,
      totalAmount,
      dailyTotals
    };

    console.log('Final summary:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transactions,
          summary
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Get transaction history error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'GET_HISTORY_ERROR',
          message: error.message || 'เกิดข้อผิดพลาดในการดึงประวัติรายการรับเงิน',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});