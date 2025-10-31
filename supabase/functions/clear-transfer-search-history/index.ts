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
    console.log('Clear transfer search history request received');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get request body
    const requestData = await req.json();
    const { sourceType, searchTerm } = requestData;
    
    console.log('Request data:', requestData);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Build the delete query
    let deleteQuery = `source_type=eq.${sourceType}`;
    
    if (searchTerm) {
      deleteQuery += `&description=ilike.*${searchTerm}*`;
    }

    console.log('Delete query:', deleteQuery);

    // First, count how many records will be deleted
    const countUrl = `${supabaseUrl}/rest/v1/transaction_history?${deleteQuery}&select=count`;
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

    if (!countResponse.ok) {
      throw new Error(`Count failed: ${countResponse.statusText}`);
    }

    const countHeader = countResponse.headers.get('content-range');
    const totalCount = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
    
    console.log(`Will delete ${totalCount} records`);

    // Delete the records
    const deleteUrl = `${supabaseUrl}/rest/v1/transaction_history?${deleteQuery}`;
    console.log('Delete URL:', deleteUrl);

    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Delete failed: ${deleteResponse.statusText}`);
    }

    // Supabase DELETE response may not have JSON body, handle gracefully
    let deleteResult = {};
    try {
      const responseText = await deleteResponse.text();
      if (responseText) {
        deleteResult = JSON.parse(responseText);
      }
    } catch (e) {
      // Response is not JSON or empty, this is normal for DELETE operations
      console.log('Delete response is not JSON or empty, which is expected');
    }
    console.log('Delete result:', deleteResult);

    return new Response(JSON.stringify({
      success: true,
      deletedCount: totalCount,
      message: `ลบรายการประวัติจากการค้นหา ${searchTerm || 'ทั้งหมด'} สำเร็จแล้ว (${totalCount} รายการ)`,
      data: deleteResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Clear history error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'CLEAR_HISTORY_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
