import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { admin } from './ghostapi.mjs';

// multipart upload needs a fresh token + FormData (not JSON), so build request here
const [kid, secretHex] = process.env.GHOST_ADMIN_KEY.split(':');
function token() {
  const iat = Math.floor(Date.now() / 1000);
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ exp: iat + 300, iat, aud: '/admin/' })).toString('base64url');
  const data = head + '.' + body;
  const sig = crypto.createHmac('sha256', Buffer.from(secretHex, 'hex')).update(data).digest().toString('base64url');
  return data + '.' + sig;
}

const zip = await readFile('/tmp/oss-blog-theme.zip');
const form = new FormData();
form.append('file', new Blob([zip], { type: 'application/zip' }), 'oss-blog-theme.zip');

const up = await fetch('http://localhost:2368/ghost/api/admin/themes/upload/', {
  method: 'POST',
  headers: { Authorization: 'Ghost ' + token() },
  body: form
});
const upText = await up.text();
if (!up.ok) {
  console.error('UPLOAD FAILED', up.status, upText.slice(0, 1200));
  process.exit(1);
}
const upJson = JSON.parse(upText);
const theme = upJson.themes?.[0] || {};
console.log('UPLOADED:', theme.name, 'active=', theme.active);
if (theme.warnings?.length) console.log('WARNINGS:', JSON.stringify(theme.warnings, null, 2));
if (theme.errors?.length) { console.log('GSCAN ERRORS:', JSON.stringify(theme.errors, null, 2)); process.exit(2); }

const act = await admin('PUT', '/themes/oss-blog-theme/activate/');
console.log('ACTIVATED:', act.themes?.[0]?.name, 'active=', act.themes?.[0]?.active);
console.log('THEME_DEPLOY_DONE');
