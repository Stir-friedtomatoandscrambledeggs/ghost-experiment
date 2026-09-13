#!/usr/bin/env bash
# 加载本地密钥后运行验收测试；密钥仅存在 tests/.env（被 .gitignore 忽略）
set -e
cd "$(dirname "$0")/.."
if [ -f tests/.env ]; then
  set -a; . tests/.env; set +a
fi
export BASE="${BASE:-http://localhost:2368}"
export CONTENT_KEY
export GHOST_ADMIN_KEY
node --test tests/*.test.mjs
