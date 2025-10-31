const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('Preview delete history request received');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get query parameters
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('searchTerm');
    const sourceType = url.searchParams.get('sourceType') || 'transfer_search';
    
    console.log('Request params:', { searchTerm, sourceType });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Build the query
    let queryParams = `source_type=eq.${sourceType}`;
    
    if (searchTerm) {
      queryParams += `&description=ilike.*${searchTerm}*`;
    }

    console.log('Query params:', queryParams);

    // Fetch the records that would be deleted
    const selectUrl = `${supabaseUrl}/rest/v1/transaction_history?${queryParams}&select=*&order=created_at.desc&limit=50`;
    console.log('Select URL:', selectUrl);

    const selectResponse = await fetch(selectUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    if (!selectResponse.ok) {
      throw new Error(`Select failed: ${selectResponse.statusText}`);
    }

    const records = await selectResponse.json();
    console.log(`Found ${records.length} records to preview`);

    // Also get the total count
    const countUrl = `${supabaseUrl}/rest/v1/transaction_history?${queryParams}&select=count`;
    console.log('Count URL:', countUrl);

    const countResponse = await fetch(countUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    const countHeader = countResponse.headers.get('content-range');
    const totalCount = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
    
    console.log(`Total records that would be deleted: ${totalCount}`);

    // Transform the records to match the expected format
    const transformedRecords = records.map((record: any) => ({
      id: record.id,
      type: 'income' as const,
      category: 'ลบรายการจากการค้นหา',
      amount: record.amount,
      sender: record.phone_number,
      datetime: record.created_at,
      status: record.status,
      description: `จะถูกลบ: ${record.description}`,
      transaction_id: record.transaction_id
    }));

    return new Response(JSON.stringify({
      success: true,
      totalCount: totalCount,
      data: transformedRecords,
      message: `พบ ${totalCount} รายการที่จะถูกลบ${searchTerm ? ` สำหรับ "${searchTerm}"` : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Preview delete error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'PREVIEW_DELETE_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
