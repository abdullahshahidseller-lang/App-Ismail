import { verifyToken, json, corsHeaders } from '../utils/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = env.ALLOWED_ORIGIN || '*';

  try {
    /* ۱. ٹوکن چیک کریں */
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    let payload;
    try {
      payload = await verifyToken(token, env.JWT_SECRET);
    } catch (e) {
      return json({ status: 'error', message: String(e.message || e) }, 401, origin);
    }

    /* ۲. صارف کی بھیجی ہوئی body پڑھیں */
    const bodyData = await request.text();
    if (!bodyData || bodyData.trim() === '') {
      return json({ status: 'error', message: 'Empty request body' }, 400, origin);
    }
    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyData);
    } catch (e) {
      return json({ status: 'error', message: 'Invalid JSON: ' + e.message }, 400, origin);
    }

    /* ۳. اہم: صارف کا بھیجا ہوا secret/role/verifiedName نظر انداز کریں،
       صرف ٹوکن سے آیا ہوا نام اور کردار اصل مانا جائے گا */
    delete parsedBody.secret;
    delete parsedBody.role;
    delete parsedBody.verifiedName;
    parsedBody.secret = env.SECRET_KEY;
    parsedBody.role = payload.role;
    parsedBody.verifiedName = payload.name;

    /* ۴. Apps Script کو بھیجیں — لنک environment variable سے آتا ہے،
       کوڈ میں کہیں نہیں لکھا */
    const response = await fetch(env.APPS_SCRIPT_URL, {
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
      return json({ status: 'error', message: 'Apps Script returned non-JSON: ' + responseText.substring(0, 200) }, 500, origin);
    }

    return json(result, 200, origin);
  } catch (err) {
    return json({ status: 'error', message: String(err) }, 500, origin);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 200, headers: corsHeaders(context.env.ALLOWED_ORIGIN || '*') });
}
