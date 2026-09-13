// 备份/恢复演练辅助：全部通过 HTTP API 读取/写入，参数来自环境变量
import { admin } from './ghostapi.mjs';
const BASE = process.env.BASE || 'http://localhost:2368';
const CKEY = process.env.CONTENT_KEY;

async function contentPosts() {
  const r = await fetch(`${BASE}/ghost/api/content/posts/?key=${CKEY}&limit=all&fields=slug,title,status`);
  return (await r.json()).posts;
}
async function publishedComments() {
  const r = await admin('GET', '/comments/?limit=all&order=created_at%20desc');
  return r.comments.filter(c => c.status === 'published');
}
const cmd = process.argv[2];
if (cmd === 'baseline') {
  const posts = await contentPosts();
  const comments = await publishedComments();
  console.log(JSON.stringify({ posts: posts.length, comments: comments.length }));
} else if (cmd === 'marker') {
  const r = await admin('POST', '/posts/', {
    posts: [{ title: '【恢复演练-可删除】临时文章 RESTORE MARKER', status: 'published' }]
  });
  console.log(r.posts[0].slug);
} else if (cmd === 'check') {
  const slug = process.argv[3];
  const basePosts = Number(process.argv[4]);
  const baseComments = Number(process.argv[5]);
  const posts = await contentPosts();
  const comments = await publishedComments();
  const markerGone = !posts.some(p => p.slug === slug);
  const postsRestored = posts.length === basePosts;
  const commentsRestored = comments.length === baseComments;
  console.log(JSON.stringify({
    marker_gone: markerGone,
    posts_now: posts.length, posts_baseline: basePosts, posts_restored: postsRestored,
    comments_now: comments.length, comments_baseline: baseComments, comments_restored: commentsRestored
  }));
  if (!(markerGone && postsRestored && commentsRestored)) process.exit(1);
} else {
  console.error('unknown command', cmd); process.exit(2);
}
