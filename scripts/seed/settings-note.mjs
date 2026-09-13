import { admin } from './ghostapi.mjs';

const settings = [
  { key: 'members_signup_access', value: 'all' },   // 任何人可注册成为会员
  { key: 'comments_enabled', value: 'all' },         // 所有登录会员均可评论
  { key: 'members_comment_mentions', value: 'off' }
];

const res = await admin('PUT', '/settings/', { settings });
console.log('updated settings count:', Array.isArray(res.settings) ? res.settings.length : res);

const cur = await admin('GET', '/settings/?group=members');
for (const s of cur.settings || []) {
  if (['members_signup_access','comments_enabled','members_comment_mentions'].includes(s.key)) {
    console.log(s.key, '=', s.value);
  }
}
console.log('SETTINGS_DONE');
