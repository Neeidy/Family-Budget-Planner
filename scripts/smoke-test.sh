#!/usr/bin/env bash
# Smoke test: HTTP-level checks against a running dev server.
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# Default BASE_URL: http://localhost:3000
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
RESULTS=()
COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

# ─── Colour helpers ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() {
  local label="$1"
  echo -e "  ${GREEN}PASS${NC}  $label"
  PASS=$((PASS + 1))
  RESULTS+=("PASS: $label")
}

fail() {
  local label="$1" detail="${2:-}"
  echo -e "  ${RED}FAIL${NC}  $label${detail:+ — $detail}"
  FAIL=$((FAIL + 1))
  RESULTS+=("FAIL: $label${detail:+ — $detail}")
}

# tRPC v11 HTTP helper — single (non-batched) mutation/query
# Args: method path body [extra_curl_args...]
trpc_call() {
  local method="$1" path="$2" body="$3"
  shift 3
  curl -s -o /dev/null -w "%{http_code}" \
    --max-time 5 \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -X "$method" \
    -H "Content-Type: application/json" \
    --data-raw "$body" \
    "$@" \
    "${BASE_URL}${path}"
}

# ─── Connectivity check ──────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Smoke Test Suite${NC} → $BASE_URL"
echo "────────────────────────────────────────────────────────────"

if ! curl -sf --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${RED}ERROR${NC}: Server not reachable at $BASE_URL"
  echo "Start it first:  pnpm dev"
  exit 1
fi
echo "Server is reachable."
echo ""

# ─── Step 0 (pre): obtain valid session cookie ───────────────────────────────
# Do this BEFORE any brute-force tests so the login rate-limit window is clean.
# tRPC v11 single-call format: body = {"json": <input>}
trpc_call POST /api/trpc/familyAuth.login \
  '{"json":{"password":"viyana2024","person":"Benim"}}' > /dev/null || true

# ─── 1. Unauthenticated GET → 401 ───────────────────────────────────────────
label="GET /api/trpc/familyBudget.get (no cookie) → 401"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 5 \
  "${BASE_URL}/api/trpc/familyBudget.get")
if [[ "$STATUS" == "401" ]]; then
  pass "$label"
else
  fail "$label" "got $STATUS"
fi

# ─── 2. Wrong password → 401 ────────────────────────────────────────────────
label="POST /api/trpc/familyAuth.login (wrong password) → 401"
# Use a fresh cookie jar (no valid session) for this test
TMP_JAR=$(mktemp)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 5 \
  -b "$TMP_JAR" -c "$TMP_JAR" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"json":{"password":"wrong-password-xyz","person":"Benim"}}' \
  "${BASE_URL}/api/trpc/familyAuth.login")
rm -f "$TMP_JAR"
if [[ "$STATUS" == "401" ]]; then
  pass "$label"
else
  fail "$label" "got $STATUS"
fi

# ─── 3. 11 wrong logins → at least one 429 ──────────────────────────────────
label="11 rapid wrong logins → at least 1 × 429 (rate limit)"
GOT_429=0
TMP_JAR=$(mktemp)
for i in $(seq 1 11); do
  S=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 5 \
    -b "$TMP_JAR" -c "$TMP_JAR" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"json\":{\"password\":\"brute-$i\",\"person\":\"Benim\"}}" \
    "${BASE_URL}/api/trpc/familyAuth.login")
  [[ "$S" == "429" ]] && GOT_429=1
done
rm -f "$TMP_JAR"
if [[ "$GOT_429" == "1" ]]; then
  pass "$label"
else
  fail "$label" "never got 429 — rate limit may be higher or window already used"
fi

# ─── 4. 300 KB body → 413 ───────────────────────────────────────────────────
label="POST familyBudget.save (300 KB body) → 413"
BIG_PAYLOAD=$(node -e "process.stdout.write(JSON.stringify({'json':{'x':'A'.repeat(310000)}}))")
STATUS=$(echo "$BIG_PAYLOAD" | curl -s -o /dev/null -w "%{http_code}" \
  --max-time 10 \
  -X POST \
  -H "Content-Type: application/json" \
  --data-binary @- \
  "${BASE_URL}/api/trpc/familyBudget.save")
if [[ "$STATUS" == "413" ]]; then
  pass "$label"
else
  fail "$label" "got $STATUS (expected 413)"
fi

# ─── 5. Invalid incomes JSON → 400 (authenticated) ──────────────────────────
label="POST familyBudget.save (incomes='deneme', authenticated) → 400"
# Uses the session cookie obtained in Step 0
STATUS=$(trpc_call POST /api/trpc/familyBudget.save \
  '{"json":{"incomes":"deneme","expenses":"[]","debts":"[]","annualPayments":"[]","budgetLimits":"[]","savingsGoals":"[]","installments":"[]","expectedUpdatedAt":null}}')
if [[ "$STATUS" == "400" ]]; then
  pass "$label"
else
  fail "$label" "got $STATUS"
fi

# ─── 6. 250 rapid requests → at least one 429 ───────────────────────────────
label="250 rapid GET familyBudget.get → at least 1 × 429 (rate limit)"
GOT_429=0
for i in $(seq 1 250); do
  S=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 3 \
    "${BASE_URL}/api/trpc/familyBudget.get")
  if [[ "$S" == "429" ]]; then
    GOT_429=1
    break
  fi
done
if [[ "$GOT_429" == "1" ]]; then
  pass "$label"
else
  fail "$label" "never got 429 — rate limit window may have reset between runs"
fi

# ─── 7. Old URL redirects (SPA) ─────────────────────────────────────────────
declare -A REDIRECTS=(
  ["/gelirler"]="/gelir-gider"
  ["/borclar"]="/borc-odemeler"
  ["/benim-butcem"]="/"
  ["/odeme-takibi"]="/borc-odemeler"
)
for OLD_PATH in "${!REDIRECTS[@]}"; do
  label="GET $OLD_PATH → accessible (SPA serves index.html)"
  RESPONSE=$(curl -s -D - --max-time 5 --max-redirs 0 \
    "${BASE_URL}${OLD_PATH}" 2>/dev/null || true)
  HTTP_CODE=$(echo "$RESPONSE" | grep -E "^HTTP/" | tail -1 | awk '{print $2}')
  # SPA: Vite/Express serves index.html (200) for all HTML routes;
  # client-side router handles the redirect. Server-side 3xx is also accepted.
  if [[ "$HTTP_CODE" =~ ^[23] ]]; then
    pass "$label (HTTP $HTTP_CODE)"
  else
    fail "$label" "HTTP $HTTP_CODE"
  fi
done

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────────────────────"
TOTAL=$((PASS + FAIL))
echo -e "Results: ${GREEN}$PASS PASS${NC} / ${RED}$FAIL FAIL${NC} (total $TOTAL)"

if [[ "$FAIL" -gt 0 ]]; then
  echo ""
  echo "Failed checks:"
  for r in "${RESULTS[@]}"; do
    [[ "$r" == FAIL:* ]] && echo "  • ${r#FAIL: }"
  done
  exit 1
fi

echo -e "${GREEN}All smoke tests passed.${NC}"
exit 0
