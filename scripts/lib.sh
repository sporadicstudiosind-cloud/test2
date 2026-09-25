#!/usr/bin/env bash
# lib.sh — shared helpers for the de-gabb toolkit. Source this; don't run it.

# Colors (disabled if not a TTY)
if [ -t 1 ]; then
  C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'
  C_BLU=$'\033[34m'; C_BLD=$'\033[1m'; C_RST=$'\033[0m'
else
  C_RED=; C_GRN=; C_YEL=; C_BLU=; C_BLD=; C_RST=
fi

say()  { printf '%s\n' "$*"; }
info() { printf '%s[i]%s %s\n' "$C_BLU" "$C_RST" "$*"; }
ok()   { printf '%s[ok]%s %s\n' "$C_GRN" "$C_RST" "$*"; }
warn() { printf '%s[!]%s %s\n' "$C_YEL" "$C_RST" "$*" >&2; }
err()  { printf '%s[x]%s %s\n' "$C_RED" "$C_RST" "$*" >&2; }
hr()   { printf '%s\n' "----------------------------------------------------------------"; }
title(){ hr; printf '%s%s%s\n' "$C_BLD" "$*" "$C_RST"; hr; }

have() { command -v "$1" >/dev/null 2>&1; }

# Confirm a risky action. Returns 0 only if the user types the exact word.
confirm_word() {
  local word="$1" prompt="${2:-Type the word to proceed}" ans
  printf '%s [%s]: ' "$prompt" "$word"
  read -r ans || return 1
  [ "$ans" = "$word" ]
}

# Require exactly one adb device; print its serial or fail.
adb_one_device() {
  have adb || { err "adb not found — run scripts/00-check-prereqs.sh"; return 1; }
  local n
  n=$(adb devices | awk 'NR>1 && $2=="device"{c++} END{print c+0}')
  if [ "$n" -eq 0 ]; then
    err "No authorized adb device. Plug in, enable USB debugging, approve the RSA prompt."
    return 1
  elif [ "$n" -gt 1 ]; then
    err "More than one adb device connected; unplug the others."
    return 1
  fi
  adb devices | awk 'NR>1 && $2=="device"{print $1; exit}'
}

# Read a single getprop value (empty string if unset). $1 = prop name.
gp() { adb shell getprop "$1" 2>/dev/null | tr -d '\r'; }
