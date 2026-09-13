import { admin } from './ghostapi.mjs';
const title = '我的博客技术栈：从写作、截图到一键发布的工具链';
const all = await admin('GET', '/posts/?limit=all&formats=html');
if ((all.posts || []).some(p => p.title === title)) {
  console.log('essay post already exists');
} else {
  await admin('POST', '/posts/?source=html', { posts: [{
    title,
    status: 'published',
    tags: [{ name: '生活随笔' }],
    html: `<p>记录这个学期为课程实验搭建博客的工具链：用 Markdown 写作，版本控制走 Git，容器保证环境一致，最后把改动通过 Pull Request 合入。</p>
<p>顺手把常用命令写成脚本，下次在另一台电脑上也能冷启动。关键词：开源、Git、工具链。</p>`
  }]});
  console.log('essay post created');
}
console.log('ESSAY_DONE');
