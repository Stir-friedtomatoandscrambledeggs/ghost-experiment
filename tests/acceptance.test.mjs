// Ghost 二次开发实验 —— 验收/回归测试
// 零第三方依赖：Node 内置 node:test + fetch。运行见 tests/README.md
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const BASE = process.env.BASE || 'http://localhost:2368';
const CKEY = process.env.CONTENT_KEY;
const AKEY = process.env.GHOST_ADMIN_KEY || '';

function jget(path) {
  return fetch(BASE + path).then(async r => ({ status: r.status, body: await r.json() }));
}
function content(qs) {
  return jget(`/ghost/api/content/posts/?key=${CKEY}&${qs}`).then(r => r.body.posts);
}
function page(path) {
  return fetch(BASE + path).then(async r => ({ status: r.status, html: await r.text() }));
}
function adminToken() {
  const [kid, hex] = AKEY.split(':');
  const iat = Math.floor(Date.now() / 1000);
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ exp: iat + 300, iat, aud: '/admin/' })).toString('base64url');
  const sig = crypto.createHmac('sha256', Buffer.from(hex, 'hex')).update(head + '.' + body).digest().toString('base64url');
  return head + '.' + body + '.' + sig;
}
async function admin(path) {
  const r = await fetch(BASE + '/ghost/api/admin' + path, {
    headers: { Authorization: 'Ghost ' + adminToken(), Accept: 'application/json' }
  });
  return { status: r.status, body: await r.json() };
}

test('1.1 前台首页可访问（HTTP 200）', async () => {
  const r = await page('/');
  assert.equal(r.status, 200);
});

test('1.2 后台 /ghost 可访问（HTTP 200）', async () => {
  const r = await page('/ghost/');
  assert.equal(r.status, 200);
});

test('2.1 已发布文章不少于 8 篇且字段完整', async () => {
  const ps = await content('limit=all&formats=html');
  assert.ok(ps.length >= 8, `实际 ${ps.length} 篇`);
  for (const p of ps) {
    assert.ok(p.title && p.slug && p.url);
  }
});

test('2.2 边界：存在超长标题文章（>=24 字）', async () => {
  const ps = await content('limit=all&fields=title,slug');
  assert.ok(ps.some(p => p.title.length >= 24));
});

test('2.3 边界：存在无封面（feature_image=null）文章', async () => {
  const ps = await content('limit=all&fields=title,feature_image');
  assert.ok(ps.some(p => p.feature_image === null));
});

test('2.4 代码块文章保留 <pre><code class="language-javascript">', async () => {
  const ps = await content('limit=all&formats=html&fields=title,html');
  const p = ps.find(x => x.title.includes('防抖与节流'));
  assert.ok(p, '应存在防抖与节流文章');
  assert.match(p.html, /<pre[^>]*>[\s\S]*?<code[^>]*language-javascript/);
});

test('3.1 三个演示标签均存在', async () => {
  const r = await jget(`/ghost/api/content/tags/?key=${CKEY}&limit=all&fields=slug,name`);
  const slugs = r.body.tags.map(t => t.slug);
  for (const s of ['frontend', 'software-engineering', 'essay']) assert.ok(slugs.includes(s), s);
});

test('3.2 /tag/frontend 标签页可打开且含对应文章', async () => {
  const r = await page('/tag/frontend/');
  assert.equal(r.status, 200);
  assert.match(r.html, /防抖/);
});

test('4.1 中文关键词搜索命中文章（Content API search 服务端过滤）', async () => {
  const q = encodeURIComponent('容器化');
  const ps = await content(`search=${q}&fields=title,slug&limit=all`);
  assert.equal(ps.length, 1);                 // 期望仅命中 1 篇（首次提交：用于暴露问题）
  assert.match(ps[0].title, /容器化/);
});

test('4.2 搜索入口存在且可键盘操作', async () => {
  const r = await page('/');
  assert.match(r.html, /data-ghost-search/);
  assert.match(r.html, /lab-search-btn/);
  assert.match(r.html, /lab-custom\.js/);
});

test('5.1 相关推荐：同主标签、最多3篇、排除当前文章', async () => {
  const all = await content('limit=all&include=tags&fields=id,title,slug,tags');
  const cur = all.find(p => p.title.includes('容器化'));
  const tag = cur.tags[0].slug;
  const filt = encodeURIComponent(`primary_tag:${tag}+id:-${cur.id}`);
  const rel = await content(`include=tags&filter=${filt}&limit=3&fields=id,title,slug,tags`);
  assert.ok(rel.length >= 1 && rel.length <= 3);
  for (const p of rel) {
    assert.notEqual(p.id, cur.id);
    assert.ok(p.tags.map(t => t.slug).includes(tag));
  }
});

test('6.1 详情页含返回首页/标签云/相关推荐/中文日期', async () => {
  const ps = await content('limit=all&fields=slug,title');
  const slug = ps.find(p => p.title.includes('容器化')).slug;
  const r = await page(`/${slug}/`);
  assert.equal(r.status, 200);
  for (const m of ['lab-back', 'lab-post-tags', 'lab-related-title', '相关推荐', '年']) {
    assert.ok(r.html.includes(m), m);
  }
});

test('7.1 （管理端）会员不少于 2 个', { skip: !AKEY }, async () => {
  const r = await admin('/members/?limit=all');
  assert.equal(r.status, 200);
  assert.ok(r.body.members.length >= 2);
});

test('7.2 （管理端）已发布评论不少于 2 条', { skip: !AKEY }, async () => {
  const r = await admin('/comments/?limit=all&order=created_at%20desc');
  const pub = r.body.comments.filter(c => c.status === 'published');
  assert.ok(pub.length >= 2, `实际 ${pub.length} 条`);
});
