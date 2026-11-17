#!/usr/bin/env bash
# 服务器侧发布脚本：构建产物 -> 独立发布目录 -> 切换 current -> 重启后端 -> 健康检查 -> 失败回滚
# 由 .github/workflows/deploy-ecs.yml 在部署机上调用，也可手工执行：
#   SRC_ROOT=$(pwd) RELEASE_SHA=$(git rev-parse --short HEAD) bash scripts/deploy-server.sh
set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/srv/cicd-demo}"
SRC_ROOT="${SRC_ROOT:-$(pwd)}"
RELEASE_SHA="${RELEASE_SHA:-$(date +%Y%m%d%H%M%S)}"
APP_PORT="${APP_PORT:-3000}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${APP_PORT}/health}"
PIDFILE="${DEPLOY_ROOT}/backend.pid"
LOG="${DEPLOY_ROOT}/backend.log"

release="${DEPLOY_ROOT}/releases/${RELEASE_SHA}"
current="${DEPLOY_ROOT}/current"

log() { printf '[deploy %s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

[ -f "${SRC_ROOT}/apps/frontend/dist/index.html" ] || { echo "缺少前端构建产物 apps/frontend/dist/index.html" >&2; exit 1; }
[ -f "${SRC_ROOT}/apps/backend/dist/server.js" ] || { echo "缺少后端编译产物 apps/backend/dist/server.js" >&2; exit 1; }

log "创建发布目录 ${release}"
mkdir -p "${release}/frontend" "${release}/backend/dist"

rsync -a --delete "${SRC_ROOT}/apps/frontend/dist/" "${release}/frontend/"
rsync -a --delete "${SRC_ROOT}/apps/backend/dist/" "${release}/backend/dist/"
rsync -a "${SRC_ROOT}/apps/backend/package.json" "${SRC_ROOT}/apps/backend/package-lock.json" "${release}/backend/"

log "安装后端生产依赖（npm ci --omit=dev）"
( cd "${release}/backend" && npm ci --omit=dev --no-audit --no-fund >/dev/null )

previous="$(readlink -f "${current}" 2>/dev/null || true)"
[ -n "${previous}" ] && log "当前版本：${previous}" || log "首次发布，无上一版本"

switch_current() {
  ln -sfn "$1" "${current}.next"
  mv -Tf "${current}.next" "${current}"
}

restart_backend() {
  if command -v systemctl >/dev/null 2>&1 && systemctl cat cicd-demo >/dev/null 2>&1; then
    log "通过 systemd 重启 cicd-demo"
    sudo -n /usr/bin/systemctl restart cicd-demo
  else
    log "当前环境无 systemd，使用 PID 守护方式重启后端"
    if [ -f "${PIDFILE}" ]; then
      kill "$(cat "${PIDFILE}")" 2>/dev/null || true
      sleep 1
    fi
    ( cd "${current}/backend" && PORT="${APP_PORT}" HOST=127.0.0.1 \
        nohup "$(command -v node)" dist/server.js >"${LOG}" 2>&1 & echo $! > "${PIDFILE}" )
    sleep 1
  fi
}

health_check() {
  local i
  for i in $(seq 1 10); do
    if curl -fsS --max-time 3 "${HEALTH_URL}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

log "切换到 ${RELEASE_SHA}"
switch_current "${release}"
restart_backend

if health_check; then
  log "健康检查通过：${HEALTH_URL} => $(curl -fsS "${HEALTH_URL}")"
  log "发布成功：commit=${RELEASE_SHA}"
else
  echo "[deploy] 健康检查失败，开始回滚" >&2
  if [ -n "${previous}" ] && [ -d "${previous}" ]; then
    switch_current "${previous}"
    restart_backend
    if health_check; then
      echo "[deploy] 已回滚到 ${previous}，服务恢复可用" >&2
    else
      echo "[deploy] 回滚后仍不可用，需要人工介入" >&2
    fi
  else
    echo "[deploy] 无历史版本可回滚，current 保持指向新版本但服务不可用" >&2
  fi
  exit 1
fi
