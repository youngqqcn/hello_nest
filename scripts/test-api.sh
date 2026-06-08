#!/usr/bin/env bash
# =============================================================================
#  scripts/test-api.sh —— hello_nest 项目端到端冒烟测试
# =============================================================================
#  覆盖 4 大切面：Middleware / Guard / Interceptor / ExceptionFilter
#
#  用法：
#    bash scripts/test-api.sh
#
#  前置：
#    - 项目已 pnpm install
#    - 端口 3000 空闲（脚本会自动尝试清理）
#    - 在项目根目录运行
#
#  退出码：
#    0 = 全部通过
#    1 = 至少一个测试失败
# =============================================================================

# 注意：不加 set -e —— 某个 expect 失败不应该让整个脚本提前退出
set -uo pipefail

# ─── 配置 ───
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="demo-key-alice-123"   # 演示用合法 API key
INVALID_KEY="wrong-key"
LOG_DIR="${LOG_DIR:-/tmp}"
LOG_FILE="$LOG_DIR/hello_nest_test.log"
APP_PID=""

# ─── 颜色（让输出更好看） ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

PASS=0
FAIL=0

# ─── 工具函数 ───
heading() { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${RESET}"; }
info()    { echo -e "${BLUE}[INFO]${RESET} $1"; }
ok()      { echo -e "${GREEN}  ✅ $1${RESET}"; PASS=$((PASS+1)); }
fail()    { echo -e "${RED}  ❌ $1${RESET}"; FAIL=$((FAIL+1)); }
warn()    { echo -e "${YELLOW}  ⚠️  $1${RESET}"; }

cleanup() {
  if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
    info "停止应用 (PID $APP_PID)"
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# 启动应用
start_app() {
  info "清理 3000 端口..."
  fuser -k -9 3000/tcp 2>/dev/null || true
  sleep 1

  info "启动应用 (npm run start)..."
  : > "$LOG_FILE"
  (npm run start > "$LOG_FILE" 2>&1) &
  APP_PID=$!

  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -s --max-time 1 "$BASE_URL/" > /dev/null 2>&1; then
      ok "应用就绪 (${i}s)"
      return 0
    fi
    sleep 1
  done
  fail "应用启动超时"
  cat "$LOG_FILE" | tail -20
  exit 1
}

# 通用测试函数：检查 HTTP code + JSON 字段
# 用法：expect "测试名" 期望HTTP 期望字段路径 期望值 "curl 命令"
expect() {
  local name="$1"
  local expected_code="$2"
  local field="$3"           # 例如 .data.user.name 或 .error.code
  local expected_value="$4"
  local curl_cmd="$5"

  echo ""
  echo -e "${BOLD}▶ $name${RESET}"
  echo -e "  ${YELLOW}CMD:${RESET} $curl_cmd"

  # 跑 curl 同时捕 HTTP code 和 body
  local response
  response=$(eval "$curl_cmd -w '\n%{http_code}'" 2>&1)
  local body
  local code
  body=$(echo "$response" | sed '$d')
  code=$(echo "$response" | tail -n 1)

  echo -e "  ${YELLOW}HTTP:${RESET} $code"
  echo -e "  ${YELLOW}BODY:${RESET} $(echo "$body" | head -c 200)"

  # 校验 HTTP code
  if [ "$code" != "$expected_code" ]; then
    fail "期望 HTTP $expected_code，实际 $code"
    return
  fi

  # 校验 JSON 字段（用 jq）
  if [ -n "$field" ] && [ -n "$expected_value" ]; then
    local actual_value
    actual_value=$(echo "$body" | jq -r "$field" 2>/dev/null || echo "PARSE_ERROR")

    if [ "$actual_value" = "$expected_value" ]; then
      ok "HTTP $expected_code + $field = $expected_value"
    else
      fail "字段 $field 期望 '$expected_value'，实际 '$actual_value'"
    fi
  else
    ok "HTTP $expected_code"
  fi
}

# ─── 主流程 ───
heading "hello_nest 4 大切面冒烟测试"
info "BASE_URL = $BASE_URL"
info "API_KEY  = $API_KEY"

# 启动应用
start_app

heading "Middleware 测试（RequestLogger + requestId）"
RESP=$(curl -s -H "x-api-key: $API_KEY" "$BASE_URL/auth/me")
REQUEST_ID=$(echo "$RESP" | jq -r '.meta.requestId' 2>/dev/null)
if [ -n "$REQUEST_ID" ] && [ "$REQUEST_ID" != "null" ] && [ "$REQUEST_ID" != "unknown" ]; then
  ok "响应里 meta.requestId 存在: ${REQUEST_ID:0:8}..."
else
  fail "响应里没找到 requestId"
fi

# 看服务端日志有没有用 requestId
# 等 Middleware 的 res.on('finish') 回调把日志 flush 到文件
# 注意：Middleware 日志只打 requestId 前 8 位（设计如此）
#       所以用 REQUEST_ID_SHORT 而不是完整 UUID
REQUEST_ID_SHORT="${REQUEST_ID:0:8}"
WAITED=0
while [ $WAITED -lt 15 ] && ! grep -q "$REQUEST_ID_SHORT" "$LOG_FILE" 2>/dev/null; do
  sleep 0.2
  WAITED=$((WAITED + 1))
done
if grep -q "$REQUEST_ID_SHORT" "$LOG_FILE" 2>/dev/null; then
  ok "服务端日志包含 requestId 前 8 位 ${REQUEST_ID_SHORT}（可全链路追踪）"
else
  fail "服务端日志没找到 requestId 前 8 位 ${REQUEST_ID_SHORT}（等了 ${WAITED} 次 × 0.2s）"
fi

heading "Guard 测试（@Public 跳过 / API Key 鉴权）"
expect "1. POST /auth/login（@Public，无 header）" \
  201 ".success" "true" \
  "curl -s -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{\"name\":\"alice\"}'"

expect "2. GET /auth/me（无 header → 401）" \
  401 ".error.code" "UNAUTHORIZED" \
  "curl -s $BASE_URL/auth/me"

expect "3. GET /auth/me（错 API key → 401）" \
  401 ".error.message" "API Key 无效" \
  "curl -s -H 'x-api-key: $INVALID_KEY' $BASE_URL/auth/me"

expect "4. GET /auth/me（对 API key → 200）" \
  200 ".data.user.name" "alice" \
  "curl -s -H 'x-api-key: $API_KEY' $BASE_URL/auth/me"

heading "Interceptor 测试（统一响应包装）"
expect "5. POST /users（响应包成 {success, data, meta}）" \
  201 ".success" "true" \
  "curl -s -X POST $BASE_URL/users -H 'Content-Type: application/json' -H 'x-api-key: $API_KEY' -d '{\"email\":\"alice@e.com\",\"name\":\"Alice\",\"password\":\"secret123\"}'"

# 验证 meta 三个字段都存在
RESP=$(curl -s -H "x-api-key: $API_KEY" "$BASE_URL/auth/me")
HAS_META=$(echo "$RESP" | jq 'has("meta") and (.meta | has("requestId") and has("timestamp") and has("duration"))' 2>/dev/null)
if [ "$HAS_META" = "true" ]; then
  ok "meta 包含 requestId + timestamp + duration"
else
  fail "meta 字段不完整"
fi

# 验证 password 不在响应里（VO @Exclude 脱敏）
PASSWORD_LEAK=$(echo "$RESP" | grep -o "password" | head -1)
if [ -z "$PASSWORD_LEAK" ]; then
  ok "VO @Exclude 脱敏生效：响应里无 password 字段"
else
  fail "响应里发现 password 字段（脱敏失效！）"
fi

heading "Pipe + Filter 测试（验证 + 异常兜底）"
expect "6. POST /users（错 body → 400，Filter 包装）" \
  400 ".error.code" "BAD_REQUEST" \
  "curl -s -X POST $BASE_URL/users -H 'Content-Type: application/json' -H 'x-api-key: $API_KEY' -d '{\"email\":\"invalid\",\"name\":\"A\",\"password\":\"abc\"}'"

expect "7. POST /books（zod 验证 → 400）" \
  400 ".error.code" "BAD_REQUEST" \
  "curl -s -X POST $BASE_URL/books -H 'Content-Type: application/json' -H 'x-api-key: $API_KEY' -d '{\"author\":\"X\",\"isbn\":\"1234567890\",\"publishedYear\":2024}'"

expect "8. GET /books/999（NotFoundException → 404）" \
  404 ".error.code" "NOT_FOUND" \
  "curl -s -H 'x-api-key: $API_KEY' $BASE_URL/books/999"

expect "9. POST /books（happy path → 201）" \
  201 ".data.title" "clean code" \
  "curl -s -X POST $BASE_URL/books -H 'Content-Type: application/json' -H 'x-api-key: $API_KEY' -d '{\"title\":\"Clean Code\",\"author\":\"Robert\",\"isbn\":\"9780132350884\",\"publishedYear\":2008,\"pages\":464}'"

heading "Middleware 日志样例（最后 5 行）"
tail -5 "$LOG_FILE" | grep -E "INFO|WARN|ERROR" | sed 's/^/  /'

# ─── 总结 ───
echo ""
heading "测试结果"
TOTAL=$((PASS + FAIL))
echo -e "  通过: ${GREEN}${PASS}${RESET} / ${TOTAL}"
echo -e "  失败: ${RED}${FAIL}${RESET} / ${TOTAL}"

if [ "$FAIL" -eq 0 ]; then
  echo -e "\n${GREEN}${BOLD}🎉 全部通过！4 大切面协作正常。${RESET}\n"
  exit 0
else
  echo -e "\n${RED}${BOLD}❌ 有 $FAIL 个测试失败，请检查上方输出。${RESET}\n"
  exit 1
fi
