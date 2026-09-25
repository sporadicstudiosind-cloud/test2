#!/usr/bin/env bash
# 02-download-firmware.sh — guided download of SIGNED stock Samsung firmware.
# Pulls from Samsung's own servers via samfirm.js or samloader. Downloads only.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

MODEL="SM-A102U1"
REGION="XAA"      # US generic; override with -r
OUT="$PWD/firmware"

usage() {
  cat <<EOF
Usage: $0 [-m MODEL] [-r REGION] [-o OUTDIR]
  -m  model  (default: $MODEL)   e.g. SM-A102U1
  -r  region/CSC (default: $REGION)  e.g. XAA (US generic). Use the CSC 01-detect.sh printed.
  -o  output dir (default: ./firmware)

This downloads Samsung's OFFICIAL SIGNED firmware. It does not flash anything.
Match the model EXACTLY to your device or you risk a brick when flashing later.
EOF
}
while getopts "m:r:o:h" opt; do case "$opt" in
  m) MODEL="$OPTARG";; r) REGION="$OPTARG";; o) OUT="$OPTARG";; h) usage; exit 0;;
  *) usage; exit 2;; esac; done

title "de-gabb :: firmware download"
info "Model=$MODEL  Region/CSC=$REGION  Out=$OUT"
case "$MODEL" in
  SM-A102U1|SM-A102U) ok "Model looks like a US A10e — good.";;
  *) warn "Model '$MODEL' is not the expected SM-A102U1. Double-check against your phone.";;
esac
warn "Flashing the wrong model/region can brick the phone. You confirmed ownership + brick risk."
confirm_word "download" "Type 'download' to proceed" || { err "Aborted."; exit 1; }

mkdir -p "$OUT"

if have npx && have node; then
  info "Using samfirm.js (npx). Streaming + decrypting from Samsung..."
  ( cd "$OUT" && npx -y samfirm -m "$MODEL" -r "$REGION" ) && {
    ok "Downloaded into: $OUT"; ls -lh "$OUT";
    info "Next: ./scripts/03-flash-stock.sh --firmware-dir '$OUT'  (dry run first)"; exit 0; }
  warn "samfirm.js path failed; trying samloader..."
fi

if have samloader || have python3; then
  info "Using samloader (Python). If not installed: pipx install samloader  (or pip install samloader)"
  if ! have samloader; then
    warn "samloader not on PATH. Install then re-run, e.g.:"
    say  "    pipx install samloader   # or: python3 -m pip install --user samloader"
    exit 1
  fi
  # samloader: check latest, download, then decrypt.
  ver="$(samloader -m "$MODEL" -r "$REGION" checkupdate 2>/dev/null | tr -d '\r')" || true
  [ -n "$ver" ] && ok "Latest version for $MODEL/$REGION: $ver" || warn "Could not query version; continuing."
  info "Downloading (encrypted) then decrypting into $OUT ..."
  ( cd "$OUT" \
    && samloader -m "$MODEL" -r "$REGION" download -v "${ver:-}" -O . \
    && for enc in *.enc4 *.enc2; do [ -e "$enc" ] && samloader -m "$MODEL" -r "$REGION" decrypt -v "${ver:-}" -i "$enc" -o "${enc%.*}"; done ) \
    && { ok "Downloaded + decrypted into: $OUT"; ls -lh "$OUT"; \
         info "Next: ./scripts/03-flash-stock.sh --firmware-dir '$OUT'"; exit 0; }
  err "samloader path failed."; exit 1
fi

err "No downloader available. Install Node (for samfirm.js) or Python+samloader. See 00-check-prereqs.sh."
exit 1
