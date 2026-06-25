#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
WAIT_SECONDS="${PHASE1_WAIT_SECONDS:-180}"

load_runtime() {
  if [ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]; then
    set +u
    # shellcheck disable=SC1091
    . "$HOME/.sdkman/bin/sdkman-init.sh"
    set -u
  fi

  if ! command -v mvn >/dev/null 2>&1; then
    echo "mvn not found. Load SDKMAN/Maven 3.6.3 before running this script." >&2
    exit 1
  fi
}

port_is_open() {
  local port="$1"
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${port}$"
}

wait_for_port() {
  local name="$1"
  local port="$2"
  local elapsed=0

  until port_is_open "$port"; do
    if [ "$elapsed" -ge "$WAIT_SECONDS" ]; then
      echo "Timed out waiting for $name on port $port. See logs/ for details." >&2
      return 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "OK: $name is listening on $port"
}

start_service() {
  local name="$1"
  local module="$2"
  local port="$3"
  local profile="${4:-}"
  local module_dir="$ROOT_DIR/backend-legacy/$module"
  local log_file="$LOG_DIR/${name}.log"
  local pid_file="$LOG_DIR/${name}.pid"

  if port_is_open "$port"; then
    echo "SKIP: $name already listens on $port"
    return 0
  fi

  if [ ! -d "$module_dir" ]; then
    echo "Missing module directory: $module_dir" >&2
    exit 1
  fi

  echo "Starting $name from $module on $port"
  (
    cd "$module_dir"
    if [ -n "$profile" ]; then
      export SPRING_PROFILES_ACTIVE="$profile"
      nohup mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=$profile" >"$log_file" 2>&1 &
    else
      nohup mvn spring-boot:run >"$log_file" 2>&1 &
    fi
    echo $! >"$pid_file"
  )

  wait_for_port "$name" "$port"
}

main() {
  load_runtime
  mkdir -p "$LOG_DIR"

  start_service "eureka" "ihrm_eureka" "6868"
  start_service "company" "ihrm_company" "9001" "dev"
  start_service "system" "ihrm_system" "9002" "dev"
  start_service "employee" "ihrm_employee" "9003" "dev"
  start_service "social" "ihrm_social_securitys" "9004" "dev"
  start_service "attendance" "ihrm_attendance" "9005" "dev"
  start_service "salary" "ihrm_salarys" "9006" "dev"
  start_service "audit" "ihrm_audit" "9007" "dev"
  start_service "gateway" "ihrm_gate" "9090" "dev"

  echo "Backend Phase 1 services started. Frontend is intentionally not started by this script."
}

main "$@"
