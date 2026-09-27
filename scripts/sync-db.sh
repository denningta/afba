#!/usr/bin/env bash
# Copy the production MongoDB into the local dev container.
#
#   npm run db:sync [user@host]      dump prod over SSH, restore locally, keep a snapshot in backup/
#   npm run db:restore [-- <file>]   restore locally from a snapshot (defaults to the newest)
#
# Uses mongodump/mongorestore rather than copying volume files, so it is safe
# against a running server and works across MongoDB versions (prod: latest, dev: 7.0).
set -Eeuo pipefail
trap 'echo "Error: ${BASH_SOURCE[0]}:${LINENO}: \"${BASH_COMMAND}\" failed" >&2' ERR

DB_NAME="afba"
CONTAINER="mongodb"       # container_name in both compose files
VOLUME="afba_data"        # external volume used by docker-compose.dev.yml
COMPOSE_FILE="docker-compose.dev.yml"
BACKUP_DIR="backup"
KEEP=5                    # snapshots to keep in BACKUP_DIR

cd "$(dirname "$0")/.."

die() { echo "Error: $*" >&2; exit 1; }

ensure_docker() {
  docker info >/dev/null 2>&1 ||
    die "can't reach Docker. If you were just added to the docker group, log out and back in (or run 'newgrp docker')."
}

# Start just the dev database (creating its volume if needed) and wait until it accepts connections.
ensure_local_db() {
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    echo "Starting local MongoDB..."
    docker volume create "$VOLUME" >/dev/null
    docker compose -f "$COMPOSE_FILE" up -d afba-database
  fi
  for _ in $(seq 30); do
    docker exec "$CONTAINER" mongosh --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1 && return
    sleep 1
  done
  die "local MongoDB didn't become ready"
}

# Read a gzipped mongodump archive on stdin and replace the local database with it.
restore_stdin() {
  docker exec -i "$CONTAINER" mongorestore --archive --gzip --drop --nsInclude="${DB_NAME}.*"
}

latest_snapshot() {
  ls -1t "$BACKUP_DIR"/"$DB_NAME"-*.archive.gz 2>/dev/null | head -n 1
}

sync_from_remote() {
  local remote_host="${1:-}"
  if [ -z "$remote_host" ]; then
    local env_file
    for env_file in .env.local .env; do
      [ -f "$env_file" ] || continue
      remote_host=$(sed -n 's/^REMOTE_DB_HOST=//p' "$env_file" | head -n 1)
      [ -n "$remote_host" ] && break
    done
  fi
  [ -n "$remote_host" ] ||
    die "no remote host. Pass one (npm run db:sync user@host) or set REMOTE_DB_HOST in .env / .env.local."

  mkdir -p "$BACKUP_DIR"
  local snapshot
  snapshot="$BACKUP_DIR/$DB_NAME-$(date +%Y%m%d-%H%M%S).archive.gz"

  echo "Syncing '$DB_NAME' from $remote_host -> local (snapshot: $snapshot)"
  if ! ssh "$remote_host" "docker exec $CONTAINER mongodump --db $DB_NAME --archive --gzip" |
    tee "$snapshot" |
    restore_stdin; then
    rm -f "$snapshot"
    die "sync failed"
  fi

  # Keep only the newest $KEEP snapshots.
  ls -1t "$BACKUP_DIR"/"$DB_NAME"-*.archive.gz | tail -n +$((KEEP + 1)) | xargs -r rm --
  echo "Sync complete."
}

restore_from_file() {
  local file="${1:-$(latest_snapshot)}"
  [ -n "$file" ] && [ -f "$file" ] || die "no snapshot found (looked in $BACKUP_DIR/)"
  echo "Restoring '$DB_NAME' from $file"
  restore_stdin <"$file"
  echo "Restore complete."
}

ensure_docker
ensure_local_db

if [ "${1:-}" = "--restore" ]; then
  restore_from_file "${2:-}"
else
  sync_from_remote "${1:-}"
fi
