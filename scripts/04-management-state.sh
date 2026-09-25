#!/usr/bin/env bash
# 04-management-state.sh — read-only probe of the device's management state.
# Answers: is Gabb a Device Owner? which restrictions block installs/Settings?
# Changes NOTHING. Requires: adb + USB debugging approved.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

title "de-gabb :: management-state probe (read-only)"
serial="$(adb_one_device)" || exit 1
ok "adb device: $serial"
hr

say "${C_BLD}Device owner / admins${C_RST}"
owners="$(adb shell dpm list-owners 2>/dev/null | tr -d '\r')"
if [ -n "$owners" ]; then printf '%s\n' "$owners" | sed 's/^/  /'
else info "dpm list-owners returned nothing (may be restricted; see dumpsys below)"; fi

# Authoritative: device_policy dump. Pull the useful bits.
dpd="$(adb shell dumpsys device_policy 2>/dev/null | tr -d '\r')"
DO_LINE="$(printf '%s\n' "$dpd" | grep -iE 'Device Owner|Profile Owner' | head -5)"
[ -n "$DO_LINE" ] && { say "  from dumpsys:"; printf '%s\n' "$DO_LINE" | sed 's/^/    /'; }

is_do=0
printf '%s\n' "$dpd" | grep -qiE 'Device Owner' && is_do=1
# Gabb/Knox admin fingerprints
admins="$(printf '%s\n' "$dpd" | grep -iE 'admin=|ComponentInfo' | grep -iE 'gabb|knox|sec|enterprise' | head -10)"
[ -n "$admins" ] && { say "  managing components:"; printf '%s\n' "$admins" | sed 's/^/    /'; }
hr

say "${C_BLD}User restrictions in force${C_RST}"
restr="$(printf '%s\n' "$dpd" | grep -iE 'no_install_apps|no_install_unknown_sources|no_debugging|no_factory_reset|no_safe_boot|no_config' | sort -u)"
if [ -n "$restr" ]; then printf '%s\n' "$restr" | sed 's/^/  /'
else info "No obvious install/debug restrictions parsed (or dump was blocked)."; fi
blocks_install=0
printf '%s\n' "$restr" | grep -qiE 'no_install_apps|no_install_unknown_sources' && blocks_install=1
hr

say "${C_BLD}Installer / store package health${C_RST}"
for p in com.google.android.packageinstaller com.android.packageinstaller \
         com.google.android.packageinstaller.samsung com.android.vending \
         com.google.android.gms; do
  state="$(adb shell "pm list packages -e $p" 2>/dev/null | tr -d '\r')"
  disabled="$(adb shell "pm list packages -d $p" 2>/dev/null | tr -d '\r')"
  if [ -n "$disabled" ]; then printf '  %-45s %sDISABLED%s\n' "$p" "$C_YEL" "$C_RST"
  elif [ -n "$state" ]; then printf '  %-45s enabled\n' "$p"
  else printf '  %-45s %snot installed%s\n' "$p" "$C_RED" "$C_RST"; fi
done
hr

say "${C_BLD}Unknown-sources setting${C_RST}"
printf '  secure install_non_market_apps : %s\n' "$(adb shell settings get secure install_non_market_apps 2>/dev/null | tr -d '\r')"
printf '  global install_non_market_apps : %s\n' "$(adb shell settings get global install_non_market_apps 2>/dev/null | tr -d '\r')"
hr

# --- Verdict ---
say "${C_BLD}Verdict${C_RST}"
if [ "$is_do" = 1 ]; then
  warn "A DEVICE OWNER is active (enterprise MDM — this is how Gabb enforces the cage)."
  say  "  You cannot lift its restrictions from inside. Rung 2 (adb sideload) will likely"
  say  "  fail with INSTALL_FAILED_USER_RESTRICTED."
  say  "  -> Reliable fix = remove the MDM via stock reflash: docs/03 then docs/02."
elif [ "$blocks_install" = 1 ]; then
  warn "Install restrictions are set even though no Device Owner was parsed."
  say  "  Try Rung 2 (scripts/05-try-sideload.sh); if it's user-restricted, go to docs/02."
else
  ok  "No Device Owner / install restriction clearly detected."
  say "  Rung 2 has a good chance: ./scripts/05-try-sideload.sh --apk /path/to.apk"
fi
hr
info "Nothing was changed. This was a read-only probe."
