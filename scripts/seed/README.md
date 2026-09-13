# 演示数据种子脚本（可复现）

用 Admin API 幂等创建：3 个标签、8 篇文章（覆盖长标题/无封面/代码块/中文搜索词）、2 个会员。

运行（Key 从环境变量传入，禁止把 Key 写进仓库）：

```bash
# 在 WSL 中，仓库根目录 scripts/seed 下
export GHOST_ADMIN_KEY='<在后台 Integrations 创建后复制>'
node seed-content.mjs
```

- 脚本可重复执行：已存在的标签名/文章标题/会员邮箱会被跳过。
- `comments_enabled`、`members_signup_access` 等站点设置 Admin API Token 无权修改，
  需管理员在后台 Settings → Membership 中手动开启（见仓库 README）。
