#!/usr/bin/env bash
# Start the dev stack and open http://localhost:3000 in the default browser once
# the app is ready — unless a browser tab is already connected to it.
#
# An open tab of the Next dev server holds a live HMR websocket to :3000, so a
# user-owned TCP connection to that port means the app is already open.
set -uo pipefail

URL="http://localhost:3000"
READY_TIMEOUT=300   # seconds to wait for the dev server to respond
RECONNECT_GRACE=5   # seconds for an already-open tab to reconnect after a restart

browser_has_tab() {
  # -p only reports processes we own, so docker-proxy (root) is excluded.
  ss -tnpH state established '( dport = :3000 )' 2>/dev/null | grep -q 'users:'
}

open_when_ready() {
  local waited=0
  until curl -s -o /dev/null --max-time 2 "$URL"; do
    sleep 2
    waited=$((waited + 2))
    (( waited >= READY_TIMEOUT )) && return
  done
  sleep "$RECONNECT_GRACE"
  browser_has_tab || xdg-open "$URL" >/dev/null 2>&1
}

open_when_ready &
opener_pid=$!
trap 'kill "$opener_pid" 2>/dev/null' EXIT

docker compose -f docker-compose.dev.yml up "$@"
