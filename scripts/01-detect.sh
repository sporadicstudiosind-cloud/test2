#!/usr/bin/env bash
# 01-detect.sh — read-only device fingerprint + custom-OS-possible verdict.
# Changes NOTHING on the phone. Requires: adb, USB debugging approved.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

title "de-gabb :: device diagnosis (read-only)"

serial="$(adb_one_device)" || exit 1
ok "adb device: $serial"
hr

model="$(gp ro.product.model)"
device="$(gp ro.product.device)"
name="$(gp ro.product.name)"
android="$(gp ro.build.version.release)"
sdk="$(gp ro.build.version.sdk)"
patch="$(gp ro.build.version.security_patch)"
fingerprint="$(gp ro.build.fingerprint)"
csc="$(gp ro.csc.sales_code)"; [ -z "$csc" ] && csc="$(gp ril.official_cscver)"
carrier="$(gp ro.boot.carrierid)"

say "${C_BLD}Identity${C_RST}"
printf '  Model            : %s\n' "${model:-?}"
printf '  Device codename  : %s\n' "${device:-?}"
printf '  Product name     : %s\n' "${name:-?}"
printf '  Android / SDK    : %s / %s\n' "${android:-?}" "${sdk:-?}"
printf '  Security patch   : %s\n' "${patch:-?}"
printf '  CSC / sales code : %s\n' "${csc:-?}"
printf '  Carrier id       : %s\n' "${carrier:-?}"
printf '  Fingerprint      : %s\n' "${fingerprint:-?}"
hr

# --- OEM unlock signals (the decisive question) ---
oem_allowed="$(gp sys.oem_unlock_allowed)"        # 1 = allowed
oem_supported="$(gp ro.oem_unlock_supported)"     # 1 = hardware supports it
flash_locked="$(gp ro.boot.flash.locked)"         # 1 = bootloader locked
verifiedboot="$(gp ro.boot.verifiedbootstate)"    # green/orange/yellow/red
oem_global="$(adb shell settings get global oem_unlock_supported 2>/dev/null | tr -d '\r')"

say "${C_BLD}Bootloader / OEM-unlock signals${C_RST}"
printf '  sys.oem_unlock_allowed        : %s\n' "${oem_allowed:-<unset>}"
printf '  ro.oem_unlock_supported       : %s\n' "${oem_supported:-<unset>}"
printf '  global oem_unlock_supported   : %s\n' "${oem_global:-<unset>}"
printf '  ro.boot.flash.locked          : %s (1=locked)\n' "${flash_locked:-<unset>}"
printf '  ro.boot.verifiedbootstate     : %s (green=locked/stock)\n' "${verifiedboot:-<unset>}"
hr

# --- Knox signals ---
warranty="$(gp ro.boot.warranty_bit)"; [ -z "$warranty" ] && warranty="$(gp ro.warranty_bit)"
knoxwarranty="$(gp ro.boot.knox.warranty)"
say "${C_BLD}Knox signals${C_RST}"
printf '  warranty_bit                  : %s (1=Knox tripped)\n' "${warranty:-<unset>}"
printf '  knox.warranty                 : %s\n' "${knoxwarranty:-<unset>}"
info "Scanning for Knox / Gabb / MDM packages..."
adb shell pm list packages 2>/dev/null | tr -d '\r' \
  | grep -Ei 'knox|gabb|sec_container|dualdar|mdm|afw|enterprise' \
  | sed 's/^package:/    /' | sort -u || say "    (none matched)"
hr

# --- Verdict ---
say "${C_BLD}Verdict${C_RST}"
case "$model" in
  SM-A102U1|SM-A102U|SM-A102W)
    warn "US/Canada A10e ($model). These almost never expose OEM Unlocking." ;;
  SM-A105*)
    ok "International A10 ($model) — this family DOES have custom-ROM support." ;;
  *) info "Model $model — check the OEM-unlock signals above against docs/01-DIAGNOSE.md." ;;
esac

unlock_possible="unknown"
if [ "${oem_allowed:-0}" = "1" ] || [ "${oem_supported:-0}" = "1" ] || [ "${oem_global:-0}" = "1" ]; then
  unlock_possible="maybe"
fi
if [ "${flash_locked:-1}" = "1" ] && [ "$unlock_possible" != "maybe" ]; then
  unlock_possible="no"
fi

case "$unlock_possible" in
  maybe)
    ok  "OEM unlock MIGHT be available. Confirm the toggle in Developer Options."
    say "  -> If togglable: docs/04-custom-os-IF-unlockable.md (custom OS is on the table)."
    say "  -> Watch for VaultKeeper re-locking after reboot." ;;
  no)
    warn "OEM unlock signals absent + bootloader locked => custom OS is very likely CLOSED."
    say "  -> Do the achievable win: docs/03-KNOX-KME-caveat.md then docs/02-DEGABB-stock-firmware.md." ;;
  *)
    info "Couldn't read OEM-unlock signals conclusively over ADB."
    say "  -> Check Developer Options visually AND read Download Mode (docs/01-DIAGNOSE.md Part B)." ;;
esac

hr
info "Nothing was changed on your phone. Verify OEM Unlocking visually before trusting any 'maybe'."
