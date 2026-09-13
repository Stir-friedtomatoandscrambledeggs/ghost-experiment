# 上游基线记录（Baseline）

> 对应实验指导书「任务 1：确定基线与需求」「步骤 2：建立上游基线证据」。
> 本表在**未做任何二次开发之前**记录固定版本，后续每个 PR 都以此为对照基线。

## 1. 选型结论

| 项目 | 选择 | 说明 |
|---|---|---|
| 可运行基线 | **TryGhost/Ghost** | 成熟内容与会员博客平台，内置编辑器、标签、会员、评论、主题机制，可把精力集中在配置、主题与扩展上 |
| 业务规范参考 | realworld-apps/realworld | 仅用于理解统一 API/E2E 规范与测试思路，本实验不重写前后端 |
| 运行方式 | **Ghost CLI 本地实例**（`ghost install local`） | SQLite、本地进程，符合「本地可运行 + 冷启动可复现」要求 |
| 二次开发边界 | **自定义主题 + Content API**，不修改 Ghost 核心 | 见 `architecture.md` |

## 2. 固定版本（实际解析并记录，不写"最新版"）

| 组件 | 版本 | 检查命令 |
|---|---|---|
| 操作系统（运行环境） | Ubuntu 22.04.1 LTS（WSL2，x86_64） | `lsb_release -a` / `uname -m` |
| 宿主系统 | Windows 11 21H2（10.0.22000） | `cmd /c ver` |
| Node.js | **v22.23.2** | `node -v` |
| npm | 10.9.8 | `npm -v` |
| Ghost | **6.63.0** | 后台右下角 / `ghost version` |
| Ghost-CLI | 1.32.5 | `ghost --version` |
| 包管理器（Ghost 内） | pnpm 12.4.0（corepack 0.34.6） | — |
| 数据库 | SQLite（better-sqlite3 12.11.1，随 Ghost 本地安装） | — |
| Git（WSL） | 2.34.1 | `git --version` |
| 安装/基线日期 | 2026-09-13 | — |

> 上游许可证：Ghost 核心为 **MIT**；默认主题 Casper 为 **MIT**。复制/修改主题时在 NOTICE 中归因。

## 3. 六条验收场景（MVP 主流程）

1. 管理员可在 `/ghost` 登录，错误口令有明确提示。
2. 管理员可创建、编辑、发布文章，文章至少关联 1 个标签。
3. 普通会员可注册/登录（演示邮箱由本地 SMTP 捕获，见 README）。
4. 登录会员可在文章详情页提交评论；匿名/无权限行为符合后台评论权限设置。
5. 可用中文关键词搜索到文章；无结果时有可理解提示。
6. 重启 Ghost 后，文章、标签、评论数据仍存在；可由导出文件恢复。

## 4. 已知风险与对策

| 风险 | 对策 |
|---|---|
| 国内网络无法直连 npmjs / GitHub / nodejs.org | apt 用阿里云镜像；npm/corepack/node-gyp/原生模块统一走 npmmirror 镜像 |
| 会员登录采用邮件魔法链接，本地无邮件服务 | 部署本地 SMTP 捕获服务，离线获取登录链接（见 README「邮件与演示账号」） |
| 运行数据/密钥误提交 Git | `.gitignore` 排除 `runtime/content/data`、日志、配置与 `.env` |
| 直接改官方主题难以区分本人改动 | 在 `theme/oss-blog-theme/` 维护独立主题源码并可打包重装 |
