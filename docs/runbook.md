# 运行手册（Runbook）

本机环境：Windows 11 + WSL2（Ubuntu 22.04）。所有命令在 WSL2 普通用户下执行。

## 0. 一次性环境准备

```bash
sudo apt update
sudo apt install -y build-essential curl git python3
# Node.js v22.23.2（Ghost 6.63 要求 >=22.23.1），解压二进制到 /usr/local
# 国内可用镜像 https://registry.npmmirror.com/-/binary/node
node -v        # v22.23.2
npm config set registry https://registry.npmmirror.com
npm i -g ghost-cli@1.32.5
```

> 国内网络编译原生模块（better-sqlite3/re2/sharp）时如遇下载失败，可设置：
> `npm_config_disturl=https://registry.npmmirror.com/-/binary/node`、
> `npm_config_better_sqlite3_binary_host_mirror=https://registry.npmmirror.com/-/binary/better-sqlite3`、
> `COREPACK_NPM_REGISTRY=https://registry.npmmirror.com`。

## 1. 安装 / 启动 Ghost

```bash
mkdir -p ~/oss-blog/runtime && cd ~/oss-blog/runtime
ghost install local          # development + SQLite，完成后自动启动
ghost status                 # Running
```

- 前台 http://localhost:2368 ，后台 http://localhost:2368/ghost
- 首次打开后台按向导创建站长账号（用本人邮箱，密码自行保管）。
- 常用：`ghost start` / `ghost stop` / `ghost restart` / `ghost logs`。
- 数据库文件：`runtime/content/data/ghost-local.db`；配置：`runtime/config.development.json`。

## 2. 配置 API 密钥

后台 **Settings → Integrations → Add custom integration**（名称如 LabSeed），得到：

- Content API Key（只读公开内容）
- Admin API Key（`kid:secret`，用于种子/主题部署脚本）

```bash
cd ~/oss-blog
cp tests/.env.example tests/.env      # 填入 BASE / CONTENT_KEY / GHOST_ADMIN_KEY
cp env.example .env 2>/dev/null || true
```

`.env` 与 `tests/.env` 已在 `.gitignore` 中，密钥不会入库。

## 3. 灌入演示内容

```bash
GHOST_ADMIN_KEY='kid:secret' node scripts/seed/seed-content.mjs
GHOST_ADMIN_KEY='kid:secret' node scripts/seed/add-essay.mjs   # 可选
```

幂等：重复执行不会产生重复标签/文章/会员。结果：标签 `frontend / software-engineering / essay`，
8 篇课程中文种子文章（另有 Ghost 默认欢迎文与 1 篇随笔），会员 2 名。

## 4. 离线邮件（会员魔法链接）

开发模式默认 transport=Direct，example.com 收不到信，用 MailDev 本地收信：

```bash
sudo npm i -g maildev
# 建议注册为 systemd 服务（SMTP 0.0.0.0:1025，Web/API 0.0.0.0:1080）
# 让 Ghost 走本地 SMTP：在 runtime/config.development.json 配置
#   "mail": { "transport": "SMTP",
#             "options": { "host":"127.0.0.1","port":1025,"secure":false,"ignoreTLS":true } }
ghost restart
```

- 信箱界面：http://localhost:1080 ；API：`GET http://127.0.0.1:1080/api/email`。
- 会员登录流程：前台输入邮箱 → Ghost 发信到 MailDev → 在 :1080 打开邮件里的
  `http://localhost:2368/members/?token=...&action=signin` 即完成登录。
- 若提示 “Too many sign-in attempts”，是登录冷却，等几分钟或清空数据库 `brute` 表后重试。
- 自动化演示评论：`python3 scripts/member/member-comment-demo.py`（走魔法链接 + integrity token 发表评论）。

## 5. 主题部署

```bash
GHOST_ADMIN_KEY='kid:secret' node scripts/theme/deploy-theme.mjs
```

脚本会把 `theme/oss-blog-theme` 打包、通过 Admin API 上传（Ghost 自动跑 gscan 校验）、激活。
也可手工：后台 **Settings → Design & branding → Change theme → Upload theme** 上传 zip。

## 6. 跑测试

```bash
bash scripts/run-tests.sh      # 读取 tests/.env；或 npm test
```

## 7. 备份与恢复

```bash
bash scripts/backup.sh          # 冷备份到 runtime/content/data/backups/
bash scripts/restore-demo.sh    # 备份→建临时文→恢复→校验
```

内容 JSON 导入/导出：后台 **Labs → Export / Import**（仅真人 owner）。

## 8. 现场演示流程（5–10 分钟）

1. `ghost status` 展示本地服务；浏览器开前台首页（中文主题、标签筛选条、搜索按钮）。
2. 点标签筛选 / 进一篇文章：中文日期、标签云、代码高亮、**相关推荐**。
3. 搜索：点「搜索」（或按 `/`）输入“容器化”，展示中文命中。
4. 会员：前台输入 member1@example.com → 在 :1080 取魔法链接登录 → 文章页发一条评论并刷新可见。
5. 后台：本人 owner 登录，新建一篇文章、改标签，前台即时可见。
6. `bash scripts/run-tests.sh` 展示 14/14 通过；展示 `tests/records/run-1-fail-search.txt`（失败）与 `run-2-pass.txt`（修复后）。
7. `bash scripts/restore-demo.sh` 或展示 `tests/records/restore.txt`，说明备份恢复。
8. `git log --oneline --graph` 展示 ≥5 提交、特性分支与合并；展示 `docs/issues/`。

## 9. 常见问题

- **后台登录循环 / origin incorrect**：多发生在云端端口转发（Cookie/Origin 不一致）。本实验改为本地 WSL2，localhost 直连无此问题。
- **ghost install 卡在原生模块**：见第 0 步镜像变量；Node 必须 ≥22.23.1。
- **邮件收不到**：确认 MailDev 运行、config 的 mail 指向 127.0.0.1:1025、`ghost restart`。
- **搜索像没过滤**：SQLite 下服务端 search 参数被忽略，前台是浏览器端过滤（见 tests/TESTING.md），属预期。
- **端口占用**：`lsof -i:2368` 或改 `config.development.json` 的 server.port。
