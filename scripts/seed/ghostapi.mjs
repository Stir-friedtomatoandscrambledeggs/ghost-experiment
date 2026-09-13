import crypto from 'node:crypto';

const KEY = process.env.GHOST_ADMIN_KEY;
if (!KEY) { console.error('missing GHOST_ADMIN_KEY'); process.exit(2); }
const [kid, secretHex] = KEY.split(':');
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

function makeToken() {
  const iat = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT', kid };
  const payload = { exp: iat + 300, iat, aud: '/admin/' };
  const body = b64url(header) + '.' + b64url(payload);
  const sig = crypto.createHmac('sha256', Buffer.from(secretHex, 'hex')).update(body).digest();
  return body + '.' + sig.toString('base64url');
}

export async function admin(method, path, payload) {
  const res = await fetch('http://localhost:2368/ghost/api/admin' + path, {
    method,
    headers: {
      Authorization: 'Ghost ' + makeToken(),
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: payload ? JSON.stringify(payload) : undefined
  });
  const txt = await res.text();
  let data; try { data = JSON.parse(txt); } catch { data = txt; }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${txt.slice(0, 600)}`);
  }
  return data;
}
