# 04 — Custom OS (only if your unit exposes OEM Unlock)

This is the "icing." Do **not** start here. Only continue if `scripts/01-detect.sh` and
Developer Options show **OEM Unlocking present and toggleable** on *your* `SM-A102U1`. On
the vast majority of these units it is missing, and then this entire chapter is a dead end
— no script or trick reopens it, because the gate lives in the bootloader, below Android.

## Gate check (be ruthlessly honest with yourself)

Proceed **only** if ALL of these are true:
- Developer Options shows **OEM Unlocking** and you can toggle it ON (not greyed).
- Download Mode shows a path to `OEM LOCK: OFF` after unlocking (KG state not `Prenormal`/`Locked`).
- You've read `00-REALITY-CHECK.md` and accept brick risk.

If OEM Unlocking is greyed with a Knox/network note, it's KG-gated — go settle Knox
(`03-KNOX-KME-caveat.md`); it may *never* ungrey on a Gabb unit.

## Reality of what's available even if unlocked

There is **no mature device-specific LineageOS for `a102` (A10e)**. The active custom-ROM
development is for **`a105` (international Galaxy A10)** — a different device. So on an A10e
your realistic custom option is a **GSI (Generic System Image)**: an AOSP/LineageOS system
image built to the generic Treble interface, flashed onto the `system` partition. Treble
support on this Exynos device is partial, so expect rough edges (VoLTE, camera, sensors).

## Outline (high level — verify each step against a current a10e-specific thread)

1. **Unlock the bootloader.** Toggle OEM Unlocking → reboot to Download Mode → follow the
   on-screen long-press **Volume Up** unlock prompt. **This wipes the device.** Confirm
   `OEM LOCK: OFF` afterward. Trips the Knox warranty fuse permanently.
2. **Let VaultKeeper release.** Boot back to Android once, connect to network, re-check that
   OEM Unlock stays on (Samsung's VaultKeeper can re-lock if it thinks unlock wasn't
   sanctioned). This is where Gabb/US units commonly fail — it re-locks.
3. **Get the right Treble/arch.** A10e is **arm64, A/B?=no (A-only), Exynos7884**. You need
   an **arm64 A-only GSI**. Confirm with a current Treble check app before downloading.
4. **Flash a GSI** onto `system` via Heimdall/Odin (as a `system.img`), wipe data, and boot.
   Keep the stock firmware handy to restore if it doesn't boot.
5. **Recovery / root (optional):** TWRP for `a10e` is not well-maintained; a patched-Magisk
   boot image or GSI-with-root is the more likely route.

Every one of these steps has device-specific gotchas. **Do not follow a generic guide
blindly** — cross-check an A10e-specific source *and* keep the stock firmware from `02` as
your parachute.

## When it doesn't work (the likely outcome)

If step 1 or 2 fails (no toggle, or VaultKeeper re-locks), **stop**. That's the definitive
answer that `SM-A102U1` won't take a custom OS, and the good outcome is still available:
de-Gabb to clean stock via `02-DEGABB-stock-firmware.md`. That gets you the freedom you
actually prioritized, minus the AOSP badge.

## Sources
- Treble / GSI background — https://en.wikipedia.org/wiki/Project_Treble
- Samsung bootloader unlock + VaultKeeper behavior — https://www.thecustomdroid.com/samsung-galaxy-bootloader-unlock-guide/
- Custom ROM list (note: "a10" = a105, not a102) — https://customrombay.org/samsung-a10/
