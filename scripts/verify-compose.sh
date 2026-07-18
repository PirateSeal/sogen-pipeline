#!/usr/bin/env bash

set -euo pipefail

compose=(docker compose -f compose.yaml)
api_image="${1:-}"
web_image="${2:-}"

cleanup() {
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

if [[ -n "$api_image" || -n "$web_image" ]]; then
  : "${api_image:?Usage: verify-compose.sh <api-image> <web-image>}"
  : "${web_image:?Usage: verify-compose.sh <api-image> <web-image>}"
  API_IMAGE="$api_image" WEB_IMAGE="$web_image" "${compose[@]}" up --detach --no-build
else
  "${compose[@]}" up --detach --build
fi

for _ in {1..30}; do
  if curl --fail --silent http://127.0.0.1:8080/healthz >/dev/null && \
    curl --fail --silent http://127.0.0.1:8080/api/status >/dev/null; then
    break
  fi
  sleep 1
done

curl --fail --silent http://127.0.0.1:8080/healthz | grep --quiet 'ok'
curl --fail --silent http://127.0.0.1:8080/api/status | grep --quiet 'appVersion'
curl --fail --silent http://127.0.0.1:8080/ | grep --quiet '<title>SLO Watch</title>'
test "$("${compose[@]}" exec --no-TTY api id -u)" -ne 0
