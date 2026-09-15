export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Body دستی پڑھیں
    let bodyData = '';
    
    await new Promise((resolve, reject) => {
      req.on('data', chunk => {
        bodyData += chunk.toString();
      });
      req.on('end', () => resolve());
      req.on('error', reject);
    });

    if (!bodyData || bodyData.trim() === '') {
      console.error('Empty body received');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Empty request body' 
      });
    }

    // JSON parse
    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyData);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid JSON: ' + e.message 
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
      return res.status(500).json({ 
        status: 'error', 
        message: 'Apps Script returned non-JSON: ' + responseText.substring(0, 200)
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: String(err) 
    });
  }
}
