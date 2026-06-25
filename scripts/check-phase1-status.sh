#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILURES=0
LOGIN_TOKEN=""

pass() {
  echo "PASS: $*"
}

fail() {
  echo "FAIL: $*" >&2
  FAILURES=$((FAILURES + 1))
}

warn() {
  echo "WARN: $*" >&2
}

port_is_open() {
  local port="$1"
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${port}$"
}

check_port() {
  local port="$1"
  local name="$2"

  if port_is_open "$port"; then
    pass "$name port $port is listening"
  else
    fail "$name port $port is not listening"
  fi
}

check_http() {
  local name="$1"
  local url="$2"
  local expected_text="${3:-}"
  local tmp_file
  local status

  tmp_file="$(mktemp)"
  status="$(curl -sS --max-time 15 -o "$tmp_file" -w "%{http_code}" "$url" 2>/dev/null || true)"

  if [ "$status" != "200" ]; then
    fail "$name returned HTTP $status for $url"
    rm -f "$tmp_file"
    return
  fi

  if [ -n "$expected_text" ] && ! grep -q "$expected_text" "$tmp_file"; then
    fail "$name returned HTTP 200 but did not contain expected marker: $expected_text"
    rm -f "$tmp_file"
    return
  fi

  pass "$name returned HTTP 200"
  rm -f "$tmp_file"
}

check_authenticated_http() {
  local name="$1"
  local url="$2"
  local expected_text="${3:-}"
  local tmp_file
  local status

  if [ -z "$LOGIN_TOKEN" ]; then
    warn "No login token available; skipping authenticated check for $name."
    return
  fi

  tmp_file="$(mktemp)"
  status="$(curl -sS --max-time 15 -o "$tmp_file" -w "%{http_code}" \
    -H "Authorization: Bearer $LOGIN_TOKEN" \
    "$url" 2>/dev/null || true)"

  if [ "$status" != "200" ]; then
    fail "$name returned HTTP $status for $url"
    rm -f "$tmp_file"
    return
  fi

  if [ -n "$expected_text" ] && ! grep -q "$expected_text" "$tmp_file"; then
    fail "$name returned HTTP 200 but did not contain expected marker: $expected_text"
    rm -f "$tmp_file"
    return
  fi

  pass "$name returned HTTP 200"
  rm -f "$tmp_file"
}

check_eureka() {
  local tmp_file
  tmp_file="$(mktemp)"

  if ! curl -fsS --max-time 15 http://127.0.0.1:6868/eureka/apps -o "$tmp_file" 2>/dev/null; then
    fail "Eureka apps endpoint is not reachable"
    rm -f "$tmp_file"
    return
  fi

  local apps=(
    IHRM-ATTENDANCE
    IHRM-COMPANY
    IHRM-GATE
    IHRM-EMPLOYEE
    IHRM-SYSTEM
    IHRM-SALARYS
    IHRM-AUDIT
    IHRM-SOCIAL-SECURITYS
  )

  local app
  for app in "${apps[@]}"; do
    if grep -q "<name>${app}</name>" "$tmp_file"; then
      pass "Eureka registered $app"
    else
      fail "Eureka missing $app"
    fi
  done

  if grep -q "<status>UP</status>" "$tmp_file"; then
    pass "Eureka contains UP instances"
  else
    fail "Eureka contains no UP instance"
  fi

  rm -f "$tmp_file"
}

check_login() {
  local mobile="${PHASE1_LOGIN_MOBILE:-}"
  local password="${PHASE1_LOGIN_PASSWORD:-}"
  local tmp_file
  local status
  local body

  if [ -z "$mobile" ]; then
    warn "PHASE1_LOGIN_MOBILE is not set; skipping login check to avoid storing a plaintext account."
    return
  fi

  if [ -z "$password" ]; then
    if [ -t 0 ]; then
      read -r -s -p "Phase 1 login password: " password
      echo
    else
      warn "PHASE1_LOGIN_PASSWORD is not set; skipping login check to avoid storing a plaintext password."
      return
    fi
  fi

  tmp_file="$(mktemp)"
  body="$(printf '{"mobile":"%s","password":"%s"}' "$mobile" "$password")"
  status="$(curl -sS --max-time 15 -o "$tmp_file" -w "%{http_code}" \
    -X POST http://127.0.0.1:8080/api/sys/login \
    -H "Content-Type: application/json" \
    -d "$body" 2>/dev/null || true)"

  if [ "$status" = "200" ] && grep -q '"success":true' "$tmp_file"; then
    LOGIN_TOKEN="$(sed -n 's/.*"data":"\([^"]*\)".*/\1/p' "$tmp_file" | head -n 1)"
    pass "Frontend proxy login returned HTTP 200 and success=true"
  else
    fail "Frontend proxy login failed with HTTP $status"
  fi

  rm -f "$tmp_file"
}

main() {
  cd "$ROOT_DIR" || exit 1

  check_port 6868 "Eureka"
  check_port 9001 "Company"
  check_port 9002 "System"
  check_port 9003 "Employee"
  check_port 9004 "Social Security"
  check_port 9005 "Attendance"
  check_port 9006 "Salary"
  check_port 9007 "Audit"
  check_port 9090 "Gateway"
  check_port 8080 "Frontend"

  check_eureka
  check_http "Gateway /test" "http://127.0.0.1:9090/test"
  check_http "Gateway /company" "http://127.0.0.1:9090/company" '"success":true'
  check_http "Frontend proxy /api/company" "http://127.0.0.1:8080/api/company" '"success":true'
  check_login
  check_authenticated_http "Authenticated frontend proxy /api/company" "http://127.0.0.1:8080/api/company" '"success":true'

  if [ "$FAILURES" -eq 0 ]; then
    echo "Phase 1 status check completed successfully."
    exit 0
  fi

  echo "Phase 1 status check completed with $FAILURES failure(s)." >&2
  exit 1
}

main "$@"
