// Cloudflare Pages Function
export async function onRequestPost(context) {
  const { request } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Body دستی پڑھیں
    const bodyData = await request.text();

    if (!bodyData || bodyData.trim() === '') {
      console.error('Empty body received');
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Empty request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // JSON parse
    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyData);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Invalid JSON: ' + e.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ✅ نیا Apps Script URL
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxT5B6rh1lBlb-ufY8ZiYqeyuzUSaiB85qXur8GVJOWDI3aoWYQMtpEZnjjGey2m3QD/exec';

    // Apps Script کو بھیجیں
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(parsedBody),
      redirect: 'follow'
    });

    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Apps Script response not JSON:', responseText.substring(0, 500));
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Apps Script returned non-JSON: ' + responseText.substring(0, 200)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (err) {
    console.error('Handler error:', err);
    return new Response(JSON.stringify({
      status: 'error',
      message: String(err)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// OPTIONS (Preflight) کے لیے
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
