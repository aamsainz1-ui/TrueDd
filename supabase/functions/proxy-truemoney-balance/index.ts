Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { endpoint, token } = await req.json();
    
    // TrueMoney API endpoints
    const trueMoneyEndpoints = {
      balance: 'https://apis.truemoneyservices.com/account/v1/balance',
      transferSearch: 'https://apis.truemoneyservices.com/account/v1/my-receive'
    };

    const trueMoneyTokens = {
      balance: '5627a2c2088405f97c0608e09f827e2d',
      transferSearch: 'fa52cb89ccde1818855aad656cc20f8b'
    };

    const apiUrl = trueMoneyEndpoints[endpoint] || trueMoneyEndpoints.balance;
    const apiToken = token || trueMoneyTokens.balance;

    console.log('Calling TrueMoney API:', endpoint, 'at', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TrueMoney API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('TrueMoney API Response:', result);

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    
    const errorResponse = {
      error: {
        code: 'TRUEMONEY_PROXY_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});