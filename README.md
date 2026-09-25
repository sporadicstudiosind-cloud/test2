# de-gabb — reclaim your own Galaxy A10e (Gabb Phone Plus / "Gabb Phone 2")

A diagnostic-first toolkit for **removing Gabb's software restrictions from a Samsung
Galaxy A10e that you fully own**, and — *only if your specific unit allows it* —
going further to a custom OS.

> **Read [`docs/00-REALITY-CHECK.md`](docs/00-REALITY-CHECK.md) before you touch anything.**
> It explains, with sources, why the exciting "install LineageOS" path is almost
> certainly blocked on this exact model, and why the *achievable* win is different
> from the one you probably came here for. If you skip it you will waste hours and
> maybe brick the phone chasing something that cannot work.

---

## What this is and isn't

**This toolkit uses only owner-level, officially supported mechanisms:**

- reading your device's real state over ADB (is the bootloader even unlockable?);
- flashing **Samsung's own cryptographically-signed stock firmware** (a supported
  operation that needs *no* bootloader unlock) to wipe Gabb's launcher/MDM back to
  plain Android;
- the official **"release" / Knox de-enrollment** route through Gabb/Samsung.

**It deliberately does NOT contain**, and I won't add:

- Knox / KG-state-"Prenormal" bypass exploits,
- MDM/Knox-Manage circumvention tools,
- anything whose purpose is defeating a lock rather than exercising your ownership.

Those don't work reliably on the US `SM-A102U1`, they brick devices, and where the
phone is genuinely still enrolled the correct fix is a **release request**, not an
exploit. See the reality check for the reasoning.

## The goal you picked

> Priority: **remove Gabb's limits** on a phone you own outright. Custom OS = icing.
> Brick risk accepted; you want to learn.
>
> Narrowed further to: **Play Store + unlocked Settings + ability to install APKs.**
> The APK installer currently refuses everything because a Device Owner (Gabb's Knox
> MDM) is vetoing installs by policy. Start at **[`docs/06-JUST-PLAYSTORE-AND-APKS.md`](docs/06-JUST-PLAYSTORE-AND-APKS.md)** —
> it runs the cheap ADB fix first and only sends you to the reflash if a Device Owner
> forces it.

Good news / bad news:

- ✅ **Removing Gabb** is realistic via the **stock-firmware reflash** path
  ([`docs/02-DEGABB-stock-firmware.md`](docs/02-DEGABB-stock-firmware.md)).
  This is the main event.
- ⚠️ There's **one real gotcha** — Knox Mobile Enrollment can *re-install* Gabb's
  management after a reset. [`docs/03-KNOX-KME-caveat.md`](docs/03-KNOX-KME-caveat.md)
  is the make-or-break chapter; read it *before* flashing, not after.
- 🎲 **Custom OS** is gated entirely on whether *your* unit exposes "OEM Unlocking".
  The detector tells you in 30 seconds. If it's missing, that path is closed — no
  script fixes it. See [`docs/04-custom-os-IF-unlockable.md`](docs/04-custom-os-IF-unlockable.md).

## Quick start

```bash
# 1. Check your computer has the tools (adb, heimdall, lz4, etc.)
./scripts/00-check-prereqs.sh

# 2. Enable Developer Options + USB debugging on the phone (docs/01-DIAGNOSE.md),
#    plug it in, then fingerprint it:
./scripts/01-detect.sh

# 3. Read the verdict the detector prints, THEN pick a path from docs/.
```

Everything destructive in `scripts/` is **dry-run by default** and refuses to flash
unless you pass an explicit `--flash` flag after reading what it will do.

## Layout

| Path | What it's for |
|---|---|
| `docs/00-REALITY-CHECK.md` | The honest constraints + counterpoints. Start here. |
| `docs/01-DIAGNOSE.md` | Enable ADB, enter Download Mode, read your true device state. |
| `docs/02-DEGABB-stock-firmware.md` | **Main path**: reflash clean stock Samsung Android. |
| `docs/03-KNOX-KME-caveat.md` | The auto-re-enrollment trap + official release route. |
| `docs/04-custom-os-IF-unlockable.md` | Bonus path, only if OEM unlock exists. |
| `docs/05-GLOSSARY.md` | KG state, RMM, KME, GSI, Knox, VaultKeeper, etc. |
| `docs/06-JUST-PLAYSTORE-AND-APKS.md` | **Narrowed goal**: Play Store + Settings + sideload; cheap ADB fix first. |
| `scripts/00-check-prereqs.sh` | Verifies/explains how to install host tools. |
| `scripts/01-detect.sh` | ADB device fingerprint + unlockability verdict. |
| `scripts/02-download-firmware.sh` | Guided stock-firmware download (samfirm.js / samloader). |
| `scripts/03-flash-stock.sh` | Heimdall reflash wrapper. Dry-run unless `--flash`. |
| `scripts/04-management-state.sh` | Read-only probe: Device Owner? which restrictions block installs? |
| `scripts/05-try-sideload.sh` | Non-destructive attempt to restore APK installs over ADB. |
| `scripts/lib.sh` | Shared helpers. |

## Legal / safety

This is **your** phone, paid off, no active line — modifying it is your right.
Flashing can still **brick the device** and **wipes all data**. There is no warranty
on any of this. You accept that risk. Don't do this to a phone that isn't yours or is
still financed/managed by someone else.
