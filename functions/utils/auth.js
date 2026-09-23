/** ================== ٹوکن بنانا اور تصدیق (HMAC-SHA256) ================== */

function base64url(bytes) {
  let str = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getKey(secret) {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

export async function signToken(payload, secret) {
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return body + '.' + base64url(sig);
}

export async function verifyToken(token, secret) {
  if (!token || token.indexOf('.') === -1) throw new Error('ٹوکن غلط ہے');
  const [body, sig] = token.split('.');
  const key = await getKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC', key, base64urlDecode(sig), new TextEncoder().encode(body)
  );
  if (!valid) throw new Error('ٹوکن کی تصدیق ناکام');
  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));
  if (!payload.exp || Date.now() > payload.exp) throw new Error('ٹوکن کی معیاد ختم — دوبارہ لاگ اِن کریں');
  return payload;
}

export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
    }
