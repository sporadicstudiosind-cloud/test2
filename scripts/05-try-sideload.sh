#!/usr/bin/env bash
# 05-try-sideload.sh — non-destructive attempt to restore APK installs over ADB.
# Tries only owner-level, reversible actions. If a Device Owner vetoes them, it says so
# and points you to the reflash. It does NOT attempt any Knox/Device-Owner bypass.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

APK=""; TARGET_PKG="com.android.chrome"
usage() {
  cat <<EOF
Usage: $0 --apk /path/to/app.apk [--grant-pkg PKG]
  --apk PATH        an APK to test-install (bypasses the on-screen installer via 'adb install')
  --grant-pkg PKG   app to grant install permission to for on-device installs (default: $TARGET_PKG)

Reversible actions attempted (all owner-level, no exploits):
  * re-enable Package Installer / Play Store packages if disabled
  * enable the 'unknown sources' setting / REQUEST_INSTALL_PACKAGES AppOp
  * adb install the test APK
If a Device Owner restriction blocks these you'll see INSTALL_FAILED_USER_RESTRICTED ->
that means the MDM must be removed (docs/02 reflash). Run scripts/04-management-state.sh first.
EOF
}
while [ $# -gt 0 ]; do case "$1" in
  --apk) APK="${2:-}"; shift 2;;
  --grant-pkg) TARGET_PKG="${2:-}"; shift 2;;
  -h|--help) usage; exit 0;;
  *) err "Unknown arg: $1"; usage; exit 2;; esac; done

title "de-gabb :: try to restore APK installs (non-destructive)"
serial="$(adb_one_device)" || exit 1
ok "adb device: $serial"
[ -n "$APK" ] && { [ -f "$APK" ] || { err "APK not found: $APK"; exit 2; }; }
hr

# 1) Re-enable installer/store packages if the MDM merely disabled them.
info "Re-enabling installer/store packages (harmless if already enabled)..."
for p in com.google.android.packageinstaller com.android.packageinstaller \
         com.android.vending com.google.android.gms; do
  out="$(adb shell "pm enable $p" 2>&1 | tr -d '\r')"
  case "$out" in
    *"new state: enabled"*|*"already"*|*enabled*) printf '  %-45s ok\n' "$p";;
    *) printf '  %-45s %s\n' "$p" "${out:-no-op}";;
  esac
done
hr

# 2) Enable unknown sources (legacy global/secure) + AppOp for a target app.
info "Enabling 'unknown sources' (legacy setting)..."
adb shell settings put secure install_non_market_apps 1 >/dev/null 2>&1 || true
adb shell settings put global install_non_market_apps 1 >/dev/null 2>&1 || true
printf '  secure now: %s   global now: %s\n' \
  "$(adb shell settings get secure install_non_market_apps 2>/dev/null | tr -d '\r')" \
  "$(adb shell settings get global install_non_market_apps 2>/dev/null | tr -d '\r')"
info "Granting REQUEST_INSTALL_PACKAGES AppOp to $TARGET_PKG (Android 8+ per-app model)..."
op_out="$(adb shell "appops set $TARGET_PKG REQUEST_INSTALL_PACKAGES allow" 2>&1 | tr -d '\r')"
[ -n "$op_out" ] && printf '  appops: %s\n' "$op_out" || printf '  appops: set (no output)\n'
hr

# 3) Test install (this is the real signal).
if [ -n "$APK" ]; then
  info "Attempting: adb install -r -g \"$APK\""
  set +e
  res="$(adb install -r -g "$APK" 2>&1 | tr -d '\r')"
  rc=$?
  set -e
  printf '%s\n' "$res" | sed 's/^/  /'
  hr
  say "${C_BLD}Result${C_RST}"
  if printf '%s' "$res" | grep -qiE 'Success'; then
    ok "APK installed. Sideloading works on this device."
    say "  -> You can install more APKs the same way, including the Play Store APK."
    say "  -> If the Play Store still won't sign in / certify, that's GMS/DO territory -> docs/02."
  elif printf '%s' "$res" | grep -qiE 'USER_RESTRICTED|restricted by (policy|admin)|DISALLOW'; then
    warn "Blocked by a Device Owner restriction (INSTALL_FAILED_USER_RESTRICTED)."
    say  "  This confirms the MDM is vetoing installs. It cannot be lifted from inside."
    say  "  -> Remove the MDM via reflash: docs/03-KNOX-KME-caveat.md then docs/02-DEGABB-stock-firmware.md"
  else
    warn "Install failed for another reason (see message above)."
    say  "  Common: wrong ABI (need arm/arm64 APK), older minSdk, or a corrupt APK."
    say  "  Re-run scripts/04-management-state.sh to confirm whether a Device Owner is present."
  fi
else
  info "No --apk given, so no test install was attempted. Settings were nudged above."
  say  "  Provide --apk /path/to.apk to get a definitive works/blocked answer."
fi
hr
info "All actions here are reversible settings/AppOps; no firmware or security state was touched."
