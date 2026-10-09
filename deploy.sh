#!/usr/bin/env bash
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -f "$SRC/deploy.config" ]]; then
  echo "Missing deploy.config — copy deploy.config.example and set DEST." >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$SRC/deploy.config"

if [[ -z "${DEST:-}" ]]; then
  echo "DEST must be set in deploy.config" >&2
  exit 1
fi

CONFIG_JS="$SRC/config.js"
[[ -f "$CONFIG_JS" ]] || CONFIG_JS="$SRC/config.template.js"

if [[ ! -f "$SRC/songs.yaml" ]]; then
  echo "Missing songs.yaml — copy songs.example.yaml and add your tracks." >&2
  exit 1
fi

sudo mkdir -p "$DEST"
sudo install -m 644 \
  "$SRC/index.html" \
  "$SRC/app.js" \
  "$SRC/styles.css" \
  "$SRC/songs.yaml" \
  "$DEST/"
sudo install -m 644 "$CONFIG_JS" "$DEST/config.js"
sudo chown -R www-data:www-data "$DEST"
echo "Deployed to $DEST"
