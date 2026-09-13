#!/usr/bin/env bash
# 冷备份 SQLite 数据库（含文章/标签/会员/评论/设置）。先停 Ghost 以避免 WAL 不一致。
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RT="$ROOT/runtime"
mkdir -p "$RT/content/data/backups"
cd "$RT"
ghost stop || true
TS="$(date +%Y%m%d-%H%M%S)"
OUT="$RT/content/data/backups/ghost-local.$TS.db"
cp "$RT/content/data/ghost-local.db" "$OUT"
ghost start
echo "BACKUP_CREATED: $OUT"
