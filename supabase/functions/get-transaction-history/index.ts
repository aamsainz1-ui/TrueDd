Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Parse query parameters for filtering
        const url = new URL(req.url);
        const limit = url.searchParams.get('limit'); // ไม่กำหนด default เพื่อให้ดึงข้อมูลทั้งหมด
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const phoneNumber = url.searchParams.get('phoneNumber');

        // Get Supabase configuration from environment
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing');
        }

        // Build query parameters for transaction_history table
        let queryParams = `select=*&order=created_at.desc`;
        
        // เพิ่ม limit เฉพาะเมื่อผู้ใช้ระบุชัดเจน
        if (limit) {
            queryParams += `&limit=${limit}`;
        }
        
        // Add filters
        const filters = [];
        
        if (startDate) {
            filters.push(`transaction_date.gte.${startDate}`);
        }
        
        if (endDate) {
            filters.push(`transaction_date.lte.${endDate}`);
        }
        
        if (phoneNumber) {
            filters.push(`phone_number.ilike.*${phoneNumber}*`);
        }

        if (filters.length > 0) {
            queryParams += '&' + filters.join('&');
        }

        // Fetch transaction history from database
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/transaction_history?${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            console.error('Database fetch error:', errorText);
            throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${fetchResponse.status}`);
        }

        const transactions = await fetchResponse.json();

        // Transform transactions data to match expected format
        const transformedTransactions = transactions.map((transaction: any) => {
            return {
                id: transaction.id,
                created_at: transaction.created_at,
                transaction_date: transaction.transaction_date,
                transaction_time: transaction.transaction_time || '00:00:00',
                phone_number: transaction.phone_number || 'ไม่ระบุ',
                amount: parseFloat(transaction.amount || 0),
                transaction_id: transaction.transaction_id || `TXN${transaction.id}`,
                status: transaction.status || 'completed',
                description: transaction.description || '',
                source_type: transaction.source_type || 'dashboard_transactions'
            };
        });

        // Calculate summary statistics
        const totalAmount = transformedTransactions.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
        const dailyTotals = transformedTransactions.reduce((acc: any, transaction: any) => {
            const date = transaction.transaction_date;
            if (!acc[date]) {
                acc[date] = { total: 0, count: 0 };
            }
            acc[date].total += transaction.amount;
            acc[date].count += 1;
            return acc;
        }, {});

        const summary = {
            totalTransactions: transformedTransactions.length,
            totalAmount: totalAmount,
            dailyTotals: Object.keys(dailyTotals).map(date => ({
                date,
                total: dailyTotals[date].total,
                count: dailyTotals[date].count
            })).sort((a, b) => b.date.localeCompare(a.date))
        };

        console.log(`Retrieved ${transformedTransactions.length} transaction records`);

        return new Response(JSON.stringify({ 
            success: true,
            data: {
                transactions: transformedTransactions,
                summary
            },
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get transaction history error:', error);

        const errorResponse = {
            error: {
                code: 'GET_TRANSACTION_HISTORY_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});