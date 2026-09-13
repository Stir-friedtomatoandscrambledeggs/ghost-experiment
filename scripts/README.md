# scripts/ 说明

所有脚本通过环境变量读取密钥，**不硬编码任何 Key**；运行前请 `export GHOST_ADMIN_KEY='kid:secret'`（或由 tests/.env 加载）。

| 路径 | 作用 |
| --- | --- |
| `seed/ghostapi.mjs` | Admin API 助手：用 Admin API Key 现场生成 5 分钟有效的 HS256 JWT |
| `seed/seed-content.mjs` | 幂等灌入演示数据：3 标签 + 8 篇中文种子文章 + 2 会员 |
| `seed/add-essay.mjs` | 可选：再补 1 篇生活随笔，使 essay 标签下有 2 篇 |
| `seed/restore-demo.mjs` | 备份恢复演练的 API 辅助（取基线/建临时文/校验） |
| `theme/deploy-theme.mjs` | 打包 `theme/oss-blog-theme` → Admin API 上传（gscan 校验）→ 激活 |
| `member/member-comment-demo.py` | 会员魔法链接登录（从 MailDev 取信）并发表评论的演示脚本 |
| `run-tests.sh` | 加载 `tests/.env` 后执行 `node --test tests/*.test.mjs` |
| `backup.sh` | 停服冷备份 SQLite 到 `runtime/content/data/backups/` |
| `restore-demo.sh` | 备份 → 建临时文 → 恢复 → 校验文章/评论数回归基线 |

## 依赖

- Node.js ≥ 22.23.1（内置 fetch / node:test，无需 npm install）。
- Python 3 仅会员评论演示脚本需要（标准库）。
- 站点运行在 http://localhost:2368；MailDev 在 :1025 / :1080（会员脚本需要）。
