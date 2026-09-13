# 开源个人博客系统二次开发（Ghost 6.63）

> 软件工程课程实验 · 实验 01：在本地把开源个人博客系统 **Ghost** 跑起来，并完成内容维护、主题二次开发、一个自主功能、会员/评论/搜索主流程、备份恢复与自动化测试。
>
> 作者：conghua Cai（19234215562@163.com） · 本地 Live Demo：<http://localhost:2368>

## 1. 项目简介

- 上游系统：[TryGhost/Ghost](https://github.com/TryGhost/Ghost)（MIT，Node.js 开源博客/CMS），本实验在其基础上做**二次开发**，不修改 Ghost 核心代码。
- 数据存储：开发模式 **SQLite**（零外部依赖，便于本地复现）。
- 二次开发产物：
  1. 自定义主题 `oss-blog-theme`（基于官方主题 Casper 派生）：中文站点适配、首页/标签页标签筛选、中文化文章卡片、中文搜索入口与快捷键等；
  2. **自主功能：文章详情页「按主标签的相关推荐」**（特性分支 + Issue + 合并，见 `docs/issues/2026-09-13-related-posts.md`）；
  3. 内容种子、会员评论、搜索、备份恢复、零依赖验收测试等可复现脚本与记录。

## 2. 技术栈与版本

| 组件 | 版本 | 说明 |
| --- | --- | --- |
| 操作系统 | Windows 11 + WSL2（Ubuntu 22.04） | 全部服务运行在 WSL2 内 |
| Node.js | v22.23.2 | Ghost 6.63 要求 ≥22.23.1 |
| npm | 10.9.8 | |
| Ghost | 6.63.0 | `ghost install local`（development） |
| Ghost-CLI | 1.32.5 | |
| 数据库 | SQLite（Ghost 内置） | 文件 `runtime/content/data/ghost-local.db` |
| 离线邮件 | MailDev（SMTP :1025，Web :1080） | 接收会员魔法链接邮件，不发真实邮件 |
| 测试 | Node 内置 `node:test` + `fetch` | 零第三方依赖 |

## 3. 目录结构

```
oss-blog/
├─ README.md                    # 本文件
├─ NOTICE                       # 上游版权与许可证归因
├─ env.example                  # 环境变量样例（密钥不入库）
├─ docs/
│  ├─ baseline.md               # 上游基线、版本、六验收场景、风险
│  ├─ architecture.md           # 架构图与修改边界（mermaid）
│  ├─ runbook.md                # 冷启动/运维/演示手册
│  └─ issues/2026-09-13-related-posts.md   # 自主功能 Issue
├─ theme/oss-blog-theme/        # 二次开发主题（Casper 派生，可直接打包安装）
├─ scripts/
│  ├─ seed/                     # 内容种子 / API 助手 / 恢复演练
│  ├─ theme/deploy-theme.mjs    # 主题打包+上传+激活（走 Admin API，含 gscan）
│  ├─ member/member-comment-demo.py  # 会员魔法链接登录→发评论演示
│  ├─ run-tests.sh              # 加载 tests/.env 后跑验收测试
│  ├─ backup.sh                 # SQLite 冷备份
│  └─ restore-demo.sh           # 备份→恢复演练
├─ tests/
│  ├─ acceptance.test.mjs       # 14 条验收/回归用例
│  ├─ .env.example              # 复制为 .env 填本地 Key（.env 不入库）
│  └─ records/                  # 测试与恢复的真实运行记录
├─ exports/                     # 后台导出的内容 JSON 存放位（运行时生成，不入库）
└─ runtime/                     # Ghost 安装/运行目录（.gitignore 排除）
```

## 4. 本地复现（冷启动）

完整分步命令见 **[`docs/runbook.md`](docs/runbook.md)**。最短路径：

```bash
# 0) WSL2 Ubuntu 22.04 内，Node≥22.23.1
node -v

# 1) 安装并启动 Ghost（development，SQLite）
mkdir -p ~/oss-blog/runtime && cd ~/oss-blog/runtime
npm i -g ghost-cli@1.32.5      # 国内可加 --registry=https://registry.npmmirror.com
ghost install local           # 启动后前台 http://localhost:2368 后台 /ghost

# 2) 浏览器打开 http://localhost:2368/ghost 完成管理员初始化

# 3) 后台 Settings→Integrations 新建自定义集成，取 Content / Admin API Key
cp tests/.env.example tests/.env     # 填入 BASE / CONTENT_KEY / GHOST_ADMIN_KEY

# 4) 灌入演示内容（幂等）：3 标签 + 8 篇中文种子 + 2 会员
GHOST_ADMIN_KEY=xxx node scripts/seed/seed-content.mjs
GHOST_ADMIN_KEY=xxx node scripts/seed/add-essay.mjs     # 可选：让 essay 标签有 2 篇

# 5) 安装并启动离线邮件 MailDev（详见 runbook），用于会员魔法链接登录

# 6) 打包并激活自定义主题（自动通过 gscan 校验）
GHOST_ADMIN_KEY=xxx node scripts/theme/deploy-theme.mjs
```

## 5. 日常启动（关机后再次演示）

```bash
cd ~/oss-blog/runtime && ghost start        # 启动 Ghost
sudo systemctl start maildev                # 离线邮件（已 enable，WSL 开 systemd 会自启）
```

- 前台：<http://localhost:2368>
- 后台：<http://localhost:2368/ghost>
- 邮件信箱（取会员登录魔法链接）：<http://localhost:1080>

## 6. 演示账号

| 角色 | 登录方式 | 凭据 |
| --- | --- | --- |
| 站长/管理员 | 后台邮箱+密码 | conghua Cai / 19234215562@163.com（密码由本人保管，不在仓库中） |
| 会员 1 | **邮箱魔法链接**（无密码） | member1@example.com（王同学） |
| 会员 2 | **邮箱魔法链接**（无密码） | member2@example.com（李同学） |

会员登录：前台打开登录框输入会员邮箱 → 到 <http://localhost:1080> 打开最新邮件中的链接即登录，随后可在文章页评论。

## 7. 六大验收场景对照

| # | 场景 | 操作路径 | 状态 |
| --- | --- | --- | --- |
| 1 | 注册/登录（会员） | 前台登录框输入邮箱 → MailDev 取魔法链接登录 | ✅ |
| 2 | 浏览文章 | 首页、标签页、文章详情页 | ✅ |
| 3 | 搜索文章（中文） | 右上角「搜索」按钮（快捷键 `/` 或 `Ctrl/Cmd+K`）→ 输入中文关键词 | ✅ |
| 4 | 发表评论 | 会员登录后在文章页发表评论 | ✅（3 条已落库） |
| 5 | 标签筛选 | 首页/标签页顶部标签条、文章卡片标签、文章页标签云 | ✅ |
| 6 | 后台内容维护 | 管理员后台新建/编辑文章、标签，主题设置 | ✅ |

> 关于搜索：**SQLite 开发库会忽略 Ghost 服务端 `search` 参数**，前台搜索（sodo-search）是拉取公开文章后在浏览器端按标题/摘要过滤。切到 MySQL（生产模式）可启用服务端全文检索。详见 `tests/TESTING.md`。

## 8. 自动化测试

```bash
bash scripts/run-tests.sh        # 或 npm test（需先 export 测试密钥）
```

共 **14** 条用例，覆盖：前台/后台可达、≥8 篇文章与字段完整性、超长标题/无封面/代码高亮边界、三标签、中文检索、相关推荐、详情页中文化元素、会员数、评论数。

测试包含一次**真实的失败→修复**：首版用例假设「Content API 服务端 search 过滤」，在 SQLite 上失败（返回全部文章），据此修正为与实际机制一致的客户端过滤断言。失败与通过记录见 `tests/records/`，分析见 [`tests/TESTING.md`](tests/TESTING.md)。

## 9. 备份与恢复

- 冷备份：`bash scripts/backup.sh`（停服复制 SQLite，避免 WAL 不一致）。
- 恢复演练：`bash scripts/restore-demo.sh`——备份 → 新建临时文章（文章数 10→11）→ 用备份覆盖恢复 → 校验临时文章消失且文章/评论数回到基线（10 / 3）。真实结果见 `tests/records/restore.txt`。
- 内容级 JSON 导入/导出：后台 **Labs → Export / Import**（导出接口仅真人 owner 可用，API Token 返回 403）。

## 10. 主题二次开发与自主功能

- 主题 `oss-blog-theme` 通过 gscan 校验（0 error），修改方式均为**叠加自定义文件 + 少量入口引用**，不改 Casper 原始逻辑：
  - 新增 `assets/css/lab-custom.css`、`assets/js/lab-custom.js`、`partials/lab-tagfilter.hbs`；
  - 首页/标签/作者页：中文标签筛选条、空状态；
  - 文章卡片：可点标签、`YYYY-MM-DD` 日期、中文阅读时长、评论数；
  - 文章页：返回首页、标签云、中文日期；
  - 顶部：中文「搜索」按钮 + `/`、`Ctrl/Cmd+K` 快捷键。
- **自主功能（非换色）**：文章页「**相关推荐**」——用 Ghost `{{#get}}` 按当前文章 `primary_tag` 取同标签最多 3 篇并排除自身，无标签时回退最新文章。走 Issue → 特性分支 `feature/blog-enhancement` → 合并主分支。

## 11. Git 工作流

- 主分支 `main`，特性分支：
  - `feature/custom-theme`：主题二次开发（Issue + 分支 + `--no-ff` 合并）；
  - `feature/blog-enhancement`：相关推荐自主功能（Issue + 分支 + `--no-ff` 合并）。
- 提交数 ≥ 5（含基线、种子、主题、自主功能、测试、备份等）。Issue 文档在 `docs/issues/`。
- 本课程验收以**本地 Live Demo + 本地 Git 历史**为准；如需在 GitHub 上呈现真实 Pull Request，可在自己的空仓库执行：

```bash
git remote add origin <你的仓库地址>
git push -u origin main
git push origin feature/blog-enhancement
# 然后在 GitHub 网页对 main 发起 Pull Request
```

## 12. 已知问题与限制

1. Ghost 官方仅原生支持 **Linux/macOS**，Windows 需用 WSL2（本机无 Docker，采用 WSL2 直装而非容器）。
2. SQLite（development）不支持服务端全文检索参数，前台搜索为浏览器端过滤；生产用 MySQL 可开启。
3. 开发模式默认邮件为 Direct，example.com 域名收不到信；本实验用 **MailDev** 离线收信，不向真实邮箱发信。
4. 内容导出/导入与部分站点设置接口仅真人 owner 可操作，Admin API Token 会收到 403（最小权限原则）。
5. 密钥（API Key、.env、数据库、runtime）均不入库；复现时按 `env.example` / `tests/.env.example` 自行配置。

## 13. 许可证与归因

本实验中的自定义修改以 MIT 提供；Ghost 与 Casper 的版权归各自作者所有，详见 [NOTICE](NOTICE)。
