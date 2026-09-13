#!/usr/bin/env bash
# 备份→恢复演练（幂等、可重复）：
#   备份当前库 -> 建临时文章 -> 用备份覆盖恢复 -> 校验临时文章消失、文章/评论数回到基线
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$ROOT/tests/.env" ] && { set -a; . "$ROOT/tests/.env"; set +a; }
export BASE CONTENT_KEY GHOST_ADMIN_KEY
RT="$ROOT/runtime"
BK="$RT/content/data/backups/pre-restore.db"
LOG="$ROOT/tests/records/restore.txt"
HELPER="$ROOT/scripts/seed/restore-demo.mjs"
mkdir -p "$RT/content/backups" "$(dirname "$LOG")"
: > "$LOG"
say(){ echo "$@" | tee -a "$LOG"; }
wait_ghost(){
  for i in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/" || true)
    [ "$code" = "200" ] && return 0
    sleep 1
  done
  echo "ghost did not become ready" | tee -a "$LOG"; return 1
}

cd "$RT"
say "== [1] stop, cold backup, start =="
ghost stop | tee -a "$LOG" || true
mkdir -p "$(dirname "$BK")"
cp "$RT/content/data/ghost-local.db" "$BK"
ghost start | tee -a "$LOG"
wait_ghost

BASELINE=$(node "$HELPER" baseline)
say "== [2] baseline: $BASELINE =="
BPOSTS=$(echo "$BASELINE" | sed -n 's/.*"posts":\([0-9]*\).*/\1/p')
BCOMMENTS=$(echo "$BASELINE" | sed -n 's/.*"comments":\([0-9]*\).*/\1/p')

SLUG=$(node "$HELPER" marker)
say "== [3] marker post created: $SLUG =="
sleep 2
AFTER=$(node "$HELPER" baseline); say "    after marker: $AFTER (posts should be $((BPOSTS+1)))"

say "== [4] stop, restore backup, start =="
ghost stop | tee -a "$LOG" || true
cp "$BK" "$RT/content/data/ghost-local.db"
ghost start | tee -a "$LOG"
wait_ghost

say "== [5] verify restore =="
node "$HELPER" check "$SLUG" "$BPOSTS" "$BCOMMENTS" | tee -a "$LOG"
say "RESTORE_DEMO_DONE"
