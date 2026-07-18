#!/usr/bin/env bash

set -euo pipefail

image_tag="${1:?Usage: verify-container.sh <image-tag>}"
container_name="slo-watch-container-check-$$"
targets_json='[{"id":"portfolio","url":"https://tcousin.com"},{"id":"vs-calculator","url":"https://vs-calculator.tcousin.com"},{"id":"sc-haul","url":"https://sc-haul.tcousin.com"}]'

cleanup() {
  docker rm --force "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach --name "$container_name" --publish 127.0.0.1::3000 \
  --env APP_VERSION=0.1.0 \
  --env TARGETS_JSON="$targets_json" \
  "$image_tag" >/dev/null

host_port=''
for _ in {1..20}; do
  host_port="$(docker port "$container_name" 3000/tcp | awk -F: 'NR == 1 { print $NF }')"
  if [ -n "$host_port" ] && curl --fail --silent "http://127.0.0.1:$host_port/healthz" >/dev/null; then
    break
  fi
  sleep 1
done

test -n "$host_port"
curl --fail --silent "http://127.0.0.1:$host_port/healthz" >/dev/null

for _ in {1..20}; do
  status_code="$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$host_port/api/status" || true)"
  if [ "$status_code" = '200' ]; then
    break
  fi
  sleep 1
done

test "${status_code:-}" = '200'
test "$(docker exec "$container_name" id -u)" -ne 0
