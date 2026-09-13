# 项目总体架构与修改边界

> 对应「任务 3：阅读项目结构」。说明「请求从主题到内容服务再到数据库」的路径，
> 以及本人**允许修改**与**禁止修改**的目录。

## 1. 总体架构

```mermaid
flowchart TD
    V[访客 / 会员] --> T[自定义主题 oss-blog-theme<br/>Handlebars .hbs + CSS/JS]
    T -->|主题助手 / 公开只读| CAPI[Ghost Content API]
    A[作者 / 管理员] --> ADM[Ghost Admin(/ghost)]
    CAPI --> CORE[Ghost 核心内容与会员服务<br/>认证·内容·标签·会员·评论·搜索]
    ADM --> CORE
    CORE --> DB[(SQLite 内容库<br/>content/data/*.sqlite3)]
    CORE --> MEM[(评论与会员数据)]
    EXP[备份/导出 JSON] -.恢复.-> CORE
    FEAT[自主扩展模块<br/>Content API 读取 + 主题渲染] --> CAPI
```

说明：

- Ghost 核心负责认证、内容、标签、会员、评论、搜索，**本人不重写这些基础能力**。
- 自定义主题与扩展模块是主要修改边界，通过**主题助手**或 **Content API** 访问内容。
- 运行数据与源码分离：数据库、日志、密钥不提交 Git。

## 2. 关键目录（5 个）

| 目录 | 作用 | 是否允许本人修改 |
|---|---|---|
| `theme/oss-blog-theme/` | **自定义主题源码**（.hbs 模板、partials、assets） | ✅ 主要修改区 |
| `runtime/content/data/` | SQLite 数据库（运行数据） | ❌ 只读/备份，不手改、不入库 |
| `runtime/content/logs/` | 运行日志 | ❌ 不手改、不入库 |
| `runtime/content/themes/` | Ghost 实际加载的主题（由源码打包/拷贝安装） | ⚠️ 只做安装/回滚，源码以 `theme/` 为准 |
| Ghost 核心 `runtime/versions/6.63.0/core/` 等 | 上游核心与 Content/Admin API | ❌ 禁止修改（升级边界） |
| `docs/` `tests/` | 文档与测试 | ✅ 允许修改 |

## 3. 一次前台请求的路径

浏览器请求文章页 → Ghost 路由选中当前主题 → 渲染 `post.hbs`/`partials`（主题助手取数据）
→ 核心经 Content 服务读取 SQLite → 拼成 HTML 返回；评论/会员状态由会员服务判定后注入。

## 4. 为什么改主题/伴随服务，而不是改核心

- 升级安全：Ghost 升级只替换 `versions/`，主题与外部 Content API 调用不受影响。
- 可辨识：改动集中、可定位、可用 gscan 校验并能独立打包重装。
- 复用：不重复实现认证、编辑器、迁移与后台管理。
