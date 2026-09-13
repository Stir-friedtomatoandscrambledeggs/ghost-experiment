# 测试说明与失败→修复记录

## 运行方式

```bash
cp tests/.env.example tests/.env   # 填入 BASE / CONTENT_KEY / GHOST_ADMIN_KEY（可选）
bash scripts/run-tests.sh          # 等价：加载 tests/.env 后 node --test tests/*.test.mjs
```

- 零第三方依赖：仅使用 Node 22 内置的 `node:test` 与全局 `fetch`。
- 全部为对本地站点 <http://localhost:2368> 的黑盒 HTTP 测试。
- 未提供 `GHOST_ADMIN_KEY` 时，7.1 / 7.2 两条管理端用例自动 skip。

## 用例清单（14 条）

| 编号 | 断言 |
| --- | --- |
| 1.1 / 1.2 | 前台首页、后台 /ghost 返回 200 |
| 2.1 | 已发布文章 ≥ 8 且 title/slug/url 完整 |
| 2.2 | 存在 ≥24 字超长标题（边界） |
| 2.3 | 存在 feature_image=null 无封面文章（边界） |
| 2.4 | 代码块文章 HTML 保留 `<pre><code class="language-javascript">` |
| 3.1 | frontend / software-engineering / essay 三标签存在 |
| 3.2 | /tag/frontend 200 且含对应文章 |
| 4.1 | 中文检索命中“容器化”，无意义词 0 命中 |
| 4.2 | 搜索入口与快捷键脚本存在 |
| 5.1 | 相关推荐：同主标签、1–3 篇、排除当前文章 |
| 6.1 | 详情页含返回首页/标签云/相关推荐/中文日期 |
| 7.1 | 会员 ≥ 2（管理端） |
| 7.2 | 已发布评论 ≥ 2（管理端） |

## 一次真实的失败 → 修复（TDD/回归证据）

**首版（提交 `test: add acceptance suite ...`）** 把 4.1 写成：

> 调用 Content API `/posts/?search=容器化`，断言服务端只返回 1 篇。

运行结果 `tests/records/run-1-fail-search.txt`：**12 通过 / 2 失败**。

两个问题及定位：

1. **4.1 搜索断言失败（对系统行为的错误假设）**
   - 现象：`search=容器化`、`search=单元测试`，甚至 `search=zzqq不存在` 都返回**全部 10 篇**。
   - 经 Content API 与 Admin API 双向验证：**SQLite 开发库会忽略 `search` 参数**（Ghost 的服务端检索依赖 MySQL 侧能力；前台 sodo-search 实际是拉取公开文章后在浏览器端按标题/摘要过滤）。
   - 修复：把 4.1 改为按与前台一致的口径，在公开文章数据上做客户端过滤断言——“容器化”能命中、无意义词 0 命中；并在 README/runbook 中如实记录该限制与 MySQL 下的差异。

2. **5.1 相关推荐用例报错（测试自身 bug）**
   - 现象：`Cannot read properties of undefined (reading 'find')`。
   - 定位：请求把关系字段 `tags` 写进了 `fields`（`fields=...,tags`），Content API 返回 400。
   - 修复：关系数据通过 `include=tags` 获取，`fields` 只保留标量列；组合过滤的 AND 连接符 `+` 在 URL 中编码为 `%2B`。

**修复后（提交 `fix(tests): ...`）** `tests/records/run-2-pass.txt`：**14 通过 / 0 失败**。

> 备注：主题开发过程中另有两次真实修复同样留在 Git 历史：gscan 报“声明了未使用的自定义设置 show_recent_posts_footer”（删除该设置），以及相关推荐标题在 `{{#get}}` 块内取不到 `{{primary_tag.name}}`（把标题移出块到文章上下文）。
