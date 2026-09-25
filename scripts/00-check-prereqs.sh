#!/usr/bin/env bash
# 00-check-prereqs.sh — verify host tools exist; explain how to install what's missing.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

title "de-gabb :: host prerequisites"

missing=0
check() { # name  purpose  install-hint
  if have "$1"; then ok "$1 — $2"; else
    warn "$1 MISSING — $2"; printf '        install: %s\n' "$3"; missing=$((missing+1));
  fi
}

info "Required for diagnosis:"
check adb   "talk to the phone over USB (read-only fingerprint)" \
            "Debian/Ubuntu: sudo apt install android-tools-adb | macOS: brew install android-platform-tools"

info "Required for the stock-firmware reflash (Heimdall path):"
check heimdall "flash signed Samsung firmware on Linux/macOS" \
               "Debian/Ubuntu: sudo apt install heimdall-flash | macOS: brew install heimdall | or build from libusb/heimdall source"
check lz4      "decompress firmware partition images (*.lz4)" \
               "Debian/Ubuntu: sudo apt install lz4 | macOS: brew install lz4"
check tar      "unpack *.tar.md5 firmware archives" "usually preinstalled"

info "Required for downloading firmware (pick ONE):"
if have node && have npx; then ok "node/npx present — you can use: npx samfirm -m SM-A102U1 -r XAA"
else warn "node/npx not found — needed for samfirm.js"; printf '        install: https://nodejs.org (LTS)\n'; fi
if have python3; then ok "python3 present — you can use samloader (pip install samloader)"
else warn "python3 not found — needed for samloader alternative"; fi

hr
if have lsusb; then
  info "USB view (look for Samsung 04e8: entries when the phone is plugged in):"
  lsusb | grep -i "04e8" || say "  (no Samsung 04e8 device seen right now — that's fine if it's unplugged)"
fi

hr
if [ "$missing" -eq 0 ]; then
  ok "All required tools present. Next: ./scripts/01-detect.sh"
else
  warn "$missing tool(s) missing above. Install them, then re-run this script."
fi

# Linux udev nudge for Heimdall/Odin-mode access without sudo
if [ "$(uname -s)" = "Linux" ] && [ ! -e /etc/udev/rules.d/51-android.rules ]; then
  info "Tip: for Heimdall without sudo, add a udev rule for Samsung download mode:"
  cat <<'RULE'
    # /etc/udev/rules.d/51-android.rules
    SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0660", GROUP="plugdev"
    # then: sudo udevadm control --reload-rules && sudo udevadm trigger
    #       sudo usermod -aG plugdev "$USER"   (log out/in after)
RULE
fi
