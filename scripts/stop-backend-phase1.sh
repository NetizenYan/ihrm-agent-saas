#!/usr/bin/env bash
set -euo pipefail

PORTS=(6868 9001 9002 9003 9004 9005 9006 9007 9090)

find_pids_by_port() {
  local port="$1"
  ss -ltnp 2>/dev/null |
    awk -v suffix=":${port}" '$4 ~ suffix "$" {print $0}' |
    sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' |
    sort -u
}

stop_pid() {
  local pid="$1"
  local port="$2"
  local comm

  comm="$(ps -p "$pid" -o comm= 2>/dev/null | tr -d '[:space:]' || true)"
  if [ "$comm" != "java" ]; then
    echo "SKIP: pid $pid on port $port is not a Java process ($comm)"
    return
  fi

  echo "Stopping Java pid $pid on port $port"
  kill "$pid" 2>/dev/null || true
}

main() {
  local port
  local pid
  local pids

  for port in "${PORTS[@]}"; do
    pids="$(find_pids_by_port "$port")"
    if [ -z "$pids" ]; then
      echo "No Java listener found on port $port"
      continue
    fi

    while IFS= read -r pid; do
      [ -n "$pid" ] && stop_pid "$pid" "$port"
    done <<<"$pids"
  done

  sleep 5

  for port in "${PORTS[@]}"; do
    pids="$(find_pids_by_port "$port")"
    while IFS= read -r pid; do
      [ -n "$pid" ] || continue
      if [ "$(ps -p "$pid" -o comm= 2>/dev/null | tr -d '[:space:]')" = "java" ]; then
        echo "Force stopping Java pid $pid on port $port"
        kill -9 "$pid" 2>/dev/null || true
      fi
    done <<<"$pids"
  done

  echo "Backend Phase 1 stop completed."
  echo "Frontend port 8080 is intentionally not stopped. Stop it manually only when needed."
}

main "$@"
