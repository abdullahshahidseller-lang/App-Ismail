import { signToken, json, corsHeaders } from '../utils/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = env.ALLOWED_ORIGIN || '*';

  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const attemptsKey = 'attempts:' + ip;

    /* غلط کوششوں کی حد: ۱۵ منٹ میں ۵ کوششیں */
    if (env.LOGIN_ATTEMPTS) {
      const raw = await env.LOGIN_ATTEMPTS.get(attemptsKey);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= 5) {
        return json({ status: 'error', message: 'بہت زیادہ غلط کوششیں — ۱۵ منٹ بعد دوبارہ کوشش کریں' }, 429, origin);
      }
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.pin || !String(body.pin).trim()) {
      return json({ status: 'error', message: 'PIN لکھیں' }, 400, origin);
    }
    const pin = String(body.pin).trim();

    /* USERS_JSON اب { "نام": { "pin": "1234", "role": "owner" }, ... } کی صورت میں ہے۔
       یہاں PIN سے نام خود تلاش کیا جاتا ہے۔ */
    const users = JSON.parse(env.USERS_JSON || '{}');
    let matchedName = null;
    let matchedRole = null;
    for (const name in users) {
      if (String(users[name].pin) === pin) {
        matchedName = name;
        matchedRole = users[name].role;
        break;
      }
    }

    if (!matchedName) {
      if (env.LOGIN_ATTEMPTS) {
        const raw = await env.LOGIN_ATTEMPTS.get(attemptsKey);
        const count = raw ? parseInt(raw, 10) : 0;
        await env.LOGIN_ATTEMPTS.put(attemptsKey, String(count + 1), { expirationTtl: 900 });
      }
      return json({ status: 'error', message: 'PIN غلط ہے' }, 401, origin);
    }

    /* کامیاب لاگ اِن — کاؤنٹر صاف کریں */
    if (env.LOGIN_ATTEMPTS) await env.LOGIN_ATTEMPTS.delete(attemptsKey);

    const exp = Date.now() + 12 * 60 * 60 * 1000; /* ۱۲ گھنٹے */
    const token = await signToken({ name: matchedName, role: matchedRole, exp }, env.JWT_SECRET);

    return json({ status: 'ok', token: token, name: matchedName, role: matchedRole, exp: exp }, 200, origin);
  } catch (err) {
    return json({ status: 'error', message: String(err) }, 500, origin);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 200, headers: corsHeaders(context.env.ALLOWED_ORIGIN || '*') });
                                   }
