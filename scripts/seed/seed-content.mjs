import { admin } from './ghostapi.mjs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureTags(tagDefs) {
  const existing = (await admin('GET', '/tags/?limit=all')).tags || [];
  const have = new Set(existing.map(t => t.name));
  for (const t of tagDefs) {
    if (!have.has(t.name)) {
      await admin('POST', '/tags/', { tags: [t] });
      console.log('tag created:', t.name);
    } else {
      console.log('tag exists :', t.name);
    }
  }
}

async function ensurePosts(postDefs) {
  const existing = (await admin('GET', '/posts/?limit=all&formats=html')).posts || [];
  const have = new Set(existing.map(p => p.title));
  let created = 0;
  for (const p of postDefs) {
    if (have.has(p.title)) { console.log('post exists:', p.title); continue; }
    await admin('POST', '/posts/?source=html', {
      posts: [{
        title: p.title,
        status: 'published',
        tags: p.tags.map(name => ({ name })),
        html: p.html
      }]
    });
    created++;
    console.log('post published:', p.title);
    await sleep(150);
  }
  return created;
}

async function ensureMembers(memberDefs) {
  const existing = (await admin('GET', '/members/?limit=all')).members || [];
  const have = new Set(existing.map(m => m.email));
  for (const m of memberDefs) {
    if (have.has(m.email)) { console.log('member exists:', m.email); continue; }
    const res = await admin('POST', '/members/', { members: [m] });
    console.log('member created:', m.email, '->', res.members?.[0]?.id ? 'ok' : JSON.stringify(res).slice(0,120));
    await sleep(120);
  }
}

const tags = [
  { name: '前端开发', slug: 'frontend', description: 'HTML/CSS/JavaScript 与浏览器原理' },
  { name: '软件工程', slug: 'software-engineering', description: '需求、测试、流程与工程实践' },
  { name: '生活随笔', slug: 'essay', description: '学习与开源参与的日常记录' }
];

const posts = [
  {
    title: '从零理解浏览器渲染流程：从输入 URL 到页面呈现的完整链路',
    tags: ['前端开发'],
    html: `<p>这是一篇没有封面图的长标题文章，用来验证长标题与无封面边界情况。</p>
<h2>一、整体链路</h2>
<p>在浏览器地址栏输入网址并回车后，依次经历 DNS 解析、建立连接、发送请求、服务器响应、<strong>HTML 解析、构建渲染树、布局与绘制</strong>。</p>
<h2>二、关键优化点</h2>
<ul><li>减少渲染阻塞资源；</li><li>避免频繁同步布局；</li><li>合理使用防抖降低事件处理频率。</li></ul>
<p>关键词：浏览器、渲染流程、前端性能。</p>`
  },
  {
    title: '用 JavaScript 实现一个简单的防抖与节流函数（含完整代码）',
    tags: ['前端开发'],
    html: `<p>防抖（debounce）与节流（throttle）是高频面试与实战考点。</p>
<h2>防抖</h2>
<pre><code class="language-javascript">function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() =&gt; fn.apply(this, args), wait);
  };
}</code></pre>
<h2>节流</h2>
<pre><code class="language-javascript">function throttle(fn, wait) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last &gt;= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}</code></pre>
<p>搜索建议框适合用防抖，滚动监听适合用节流。关键词：JavaScript、防抖、节流。</p>`
  },
  {
    title: 'CSS Flexbox 布局实战：居中与自适应宽度的三种写法',
    tags: ['前端开发'],
    html: `<p>Flexbox 让一维布局变得简单。本文记录居中、等分、换行三种常见需求。</p>
<ul><li>水平垂直居中：justify-content + align-items；</li><li>等分宽度：flex: 1；</li><li>自适应换行：flex-wrap: wrap。</li></ul>
<p>配合移动端媒体查询可保证窄屏不溢出。关键词：CSS、Flexbox、响应式。</p>`
  },
  {
    title: '需求分析阶段如何写好一份可测试的用例规格说明',
    tags: ['软件工程'],
    html: `<p>好的需求应当可验证。每条用例至少包含前置条件、操作步骤、期望结果与负责人。</p>
<h2>写作要点</h2>
<ol><li>用业务语言描述，不绑定实现；</li><li>覆盖正常流与边界/异常流；</li><li>给出明确的验收条件。</li></ol>
<blockquote>验收条件越具体，后续测试越容易自动化。</blockquote>
<p>关键词：需求分析、用例、验收条件。</p>`
  },
  {
    title: '单元测试入门：以一个格式化金额函数为例讲清断言与边界',
    tags: ['软件工程'],
    html: `<p>单元测试关注最小可测单元。下面是被测函数与断言示例。</p>
<pre><code class="language-javascript">function formatMoney(n) {
  if (typeof n !== 'number') return '0.00';
  return n.toFixed(2);
}
// 断言：边界值 0、负数、非数字输入
console.assert(formatMoney(0) === '0.00');
console.assert(formatMoney(-1) === '-1.00');
console.assert(formatMoney('x') === '0.00');</code></pre>
<p>先列等价类与边界值，再补断言，失败用例要记录原因与修复提交。关键词：单元测试、断言、边界值。</p>`
  },
  {
    title: '容器化部署入门：Docker 基本概念与本地开发常用命令',
    tags: ['软件工程'],
    html: `<p>容器化把应用及其依赖打包成一致的运行环境，解决“在我机器上能跑”的问题。</p>
<h2>三个核心概念</h2>
<ul><li>镜像 Image：只读模板；</li><li>容器 Container：镜像的运行实例；</li><li>卷 Volume：持久化数据。</li></ul>
<pre><code class="language-bash">docker compose up -d
docker compose logs -f
docker compose down</code></pre>
<p>关键词：容器化、Docker、部署。</p>`
  },
  {
    title: '敏捷开发中的每日站会到底应该怎么开才不流于形式',
    tags: ['软件工程'],
    html: `<p>站会不是汇报表演，而是团队同步阻塞、对齐当天计划的短会。</p>
<p>建议控制在 15 分钟内，围绕三件事：昨天完成了什么、今天计划做什么、遇到什么阻碍。阻碍应在会后立刻跟进。</p>
<p>关键词：敏捷、站会、团队协作。</p>`
  },
  {
    title: '在开源项目里提交我的第一个 Pull Request：一次完整的参与记录',
    tags: ['生活随笔'],
    html: `<p>第一次给开源项目贡献代码比想象中简单：先 Fork，再建特性分支，小步提交后发起 Pull Request。</p>
<h2>过程回顾</h2>
<ol><li>阅读 README 与贡献指南；</li><li>在 Issue 下说明自己要解决的问题；</li><li>提交代码并根据 Review 修改。</li></ol>
<p>维护者的一条建议让我理解了测试的重要性。关键词：开源、Git、Pull Request。</p>`
  }
];

const members = [
  { name: '王同学', email: 'member1@example.com' },
  { name: '李同学', email: 'member2@example.com' }
];

await ensureTags(tags);
const n = await ensurePosts(posts);
await ensureMembers(members);

console.log('----- SUMMARY -----');
console.log('posts created this run:', n);
console.log('total tags:', (await admin('GET', '/tags/?limit=all')).tags.filter(t=>t.name!=='#internal').length);
console.log('total members:', (await admin('GET', '/members/?limit=all')).members.length);
console.log('SEED_DONE');
