#!/usr/bin/env bash
# 03-flash-stock.sh — Heimdall wrapper to flash SIGNED stock firmware.
# DRY-RUN by default: it prints exactly what it would flash and changes nothing.
# It only flashes when you pass --flash AND type the confirmation word.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

FWDIR=""; DO_FLASH=0
usage() {
  cat <<EOF
Usage: $0 --firmware-dir DIR [--flash]
  --firmware-dir DIR   directory containing the extracted firmware (AP_*, BL_*, CP_*, CSC_* .tar.md5)
  --flash              actually flash. Without it, this is a DRY RUN (default, safe).

Safety model:
  * Dry run extracts + inspects firmware and PRINTS the heimdall command. No device writes.
  * --flash still requires the device in Download Mode and an explicit typed confirmation.
  * Uses the wiping CSC (full clean de-Gabb), NOT HOME_CSC.
Read docs/02-DEGABB-stock-firmware.md and settle Knox/KME (docs/03) BEFORE --flash.
EOF
}
while [ $# -gt 0 ]; do case "$1" in
  --firmware-dir) FWDIR="${2:-}"; shift 2;;
  --flash) DO_FLASH=1; shift;;
  -h|--help) usage; exit 0;;
  *) err "Unknown arg: $1"; usage; exit 2;; esac; done

[ -n "$FWDIR" ] || { err "--firmware-dir is required"; usage; exit 2; }
[ -d "$FWDIR" ] || { err "No such dir: $FWDIR"; exit 2; }
have heimdall || { err "heimdall not found — run scripts/00-check-prereqs.sh"; exit 1; }
have lz4 || { err "lz4 not found — needed to decompress partition images"; exit 1; }

title "de-gabb :: stock firmware flash ($([ "$DO_FLASH" = 1 ] && echo LIVE || echo DRY-RUN))"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/degabb-fw.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
info "Work dir: $WORK"

# 1) Unpack any *.tar.md5 (tar.md5 is just a tar with an md5 appended).
info "Unpacking *.tar.md5 archives from $FWDIR ..."
shopt -s nullglob
found=0
for tf in "$FWDIR"/*.tar.md5 "$FWDIR"/*.tar; do
  [ -e "$tf" ] || continue; found=1
  say "  + $(basename "$tf")"
  tar -xf "$tf" -C "$WORK" 2>/dev/null || warn "    (tar reported trailing md5 bytes — normal, images still extracted)"
done
[ "$found" = 1 ] || { err "No *.tar.md5 / *.tar found in $FWDIR. Did the download/extract step run?"; exit 1; }

# 2) Decompress *.lz4 -> raw partition images.
info "Decompressing *.lz4 partition images ..."
( cd "$WORK" && for f in *.lz4; do [ -e "$f" ] && lz4 -dm --rm "$f" 2>/dev/null; done )

# 3) Show what we have and build a partition->image map for common A10e partitions.
info "Partition images found:"
( cd "$WORK" && ls -1 *.img *.bin 2>/dev/null | sed 's/^/    /' ) || warn "  (none — unexpected)"

# Map common Samsung partition names to their image files if present.
declare -a PAIRS
add_pair() { local part="$1" file="$2"; [ -e "$WORK/$file" ] && PAIRS+=("$part=$WORK/$file"); }
add_pair BOOT           boot.img
add_pair RECOVERY       recovery.img
add_pair SYSTEM         system.img
add_pair VENDOR         vendor.img
add_pair USERDATA       userdata.img
add_pair CACHE          cache.img
add_pair BOOTLOADER     sboot.bin
add_pair CM             cm.bin
add_pair RADIO          modem.bin
add_pair PARAM          param.bin
add_pair UP_PARAM       up_param.bin
add_pair DTBO           dtbo.img
add_pair ODM            odm.img
add_pair PRODUCT        product.img

if [ "${#PAIRS[@]}" -eq 0 ]; then
  err "Could not map any known partitions. Read the PIT and map manually (see below)."
fi

# 4) Read the device PIT if a device is connected (authoritative partition names).
if heimdall detect >/dev/null 2>&1; then
  ok "Heimdall detects a device in Download Mode."
  info "Device PIT (authoritative partition list):"
  heimdall print-pit 2>/dev/null | sed 's/^/    /' || warn "  (couldn't read PIT; ensure Download Mode)"
else
  warn "No device detected in Download Mode right now."
  say  "  Put the phone in Download Mode (docs/01-DIAGNOSE.md Part B) before --flash."
fi

# 5) Build the heimdall command.
CMD=(heimdall flash --resume)
for p in "${PAIRS[@]}"; do CMD+=(--"${p%%=*}" "${p#*=}"); done

hr
say "${C_BLD}Planned flash command:${C_RST}"
printf '  '; printf '%q ' "${CMD[@]}"; printf '\n'
hr
warn "Verify these partitions match the PIT above. --USERDATA wipes user data (intended for clean de-Gabb)."
warn "If a partition name here isn't in your device PIT, remove it from the map before flashing."

if [ "$DO_FLASH" != 1 ]; then
  ok "DRY RUN complete. Nothing was written. Re-run with --flash when ready and in Download Mode."
  exit 0
fi

# --- LIVE flash guardrails ---
heimdall detect >/dev/null 2>&1 || { err "Device not in Download Mode. Aborting."; exit 1; }
[ "${#PAIRS[@]}" -gt 0 ] || { err "No partitions mapped. Aborting."; exit 1; }
warn "This will OVERWRITE the phone's firmware and ERASE data. Brick risk is real."
warn "Confirm you have (1) matched model/region, (2) settled Knox/KME, (3) a working cable/port."
confirm_word "FLASH" "Type 'FLASH' (all caps) to write firmware now" || { err "Aborted."; exit 1; }

info "Flashing... do NOT unplug. Watch the phone's progress bar."
"${CMD[@]}"
rc=$?
if [ $rc -eq 0 ]; then
  ok "Heimdall reported success. Let the phone reboot (first boot is slow)."
  info "Set up OFFLINE first to check for Gabb/KME re-enrollment (docs/03)."
else
  err "Heimdall exited $rc. If soft-bricked, re-enter Download Mode and flash the full firmware again."
fi
exit $rc
