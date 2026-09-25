# 06 — "I just want Play Store, Settings, and to install APKs"

This is the narrowed, real goal. It maps to one technical question: **is Gabb's software
a true Device Owner (enterprise MDM), or something lighter?** The answer decides whether
you can fix this in five minutes over ADB or need the stock reflash.

## Why your APK installer "doesn't install"

The installer app isn't broken. A **Device Owner** (Samsung Knox Manage, enrolled by Gabb)
can set system restrictions that make every install fail and hide Settings / the Play Store:

- `DISALLOW_INSTALL_APPS` — blocks *all* app installs, even `adb install`.
- `DISALLOW_INSTALL_UNKNOWN_SOURCES` — blocks sideloading specifically.
- Package Installer / Play Store packages disabled or never shipped.
- Settings entries hidden by the MDM.

A Device Owner is the highest-privilege management role in Android. You **cannot** turn its
restrictions off from inside the phone — that's the whole point of the role. It goes away
only when (a) the MDM un-enrolls it, or (b) the device is wiped to firmware that doesn't
contain it.

## The ladder: cheapest fix first

Run these in order. Stop at the first one that gets you what you want.

### Rung 1 — Diagnose the management state (read-only, 1 min)
```bash
./scripts/04-management-state.sh
```
It reports: is there a **Device Owner**? which admin packages? which **user restrictions**
are set? is the Package Installer / Play Store **disabled**? Read its verdict:

- **"No Device Owner; installer just disabled"** → Rung 2 will very likely work. No reflash.
- **"Device Owner present (Gabb/Knox)"** → Rung 2 will hit `INSTALL_FAILED_USER_RESTRICTED`;
  you'll need Rung 3. Don't waste hours fighting it.

### Rung 2 — Try to restore installs over ADB (non-destructive)
Only meaningful if Developer Options + USB debugging are reachable.
```bash
# Attempt to re-enable installs + the installer, then install a test APK:
./scripts/05-try-sideload.sh --apk /path/to/some.apk
```
This tries owner-level, reversible actions only: re-enable the Package Installer package,
flip the "unknown sources" AppOp/setting, and `adb install` your APK (which bypasses the
on-screen installer). If it prints `Success`, you can sideload — and installing the Play
Store APK the same way may restore the store. If it prints `INSTALL_FAILED_USER_RESTRICTED`
or the AppOps/setting won't stick, a Device Owner is vetoing it → Rung 3.

> Note: even if Rung 2 lets you sideload, a Device Owner may still block the Play Store from
> *working* (Google certification / GMS), and Settings may stay locked. If you want all
> three cleanly, Rung 3 is the honest answer.

### Rung 3 — Remove the MDM the only reliable way: stock reflash (+ KME release)
This wipes the Device Owner entirely and installs plain Android 11 **with** Play Store,
full Settings, and normal sideloading.
1. `docs/03-KNOX-KME-caveat.md` — get Gabb to **release** the IMEI first, or the MDM
   re-enrolls after the wipe and you're back to square one.
2. `docs/02-DEGABB-stock-firmware.md` — flash signed stock firmware.
3. First boot **offline** to confirm no re-enrollment, then sign in to Play Store.

## Straight answer to "do I have to reflash?"

- If Rung 1 says **no Device Owner** → probably not; Rung 2 fixes it.
- If Rung 1 says **Device Owner = Gabb/Knox** (the likely case) → **yes**, reflash is the
  dependable path to all three, because that's the only thing that removes a Device Owner
  you don't control. Everything short of it is a partial, fragile workaround.

What I won't hand you is a Knox/Device-Owner *bypass exploit*. On `SM-A102U1` they're
unreliable and can permanently trip Knox or brick the phone, and the clean reflash gets you
the exact three things you asked for without that risk.

## Sources
- Android Device Owner user restrictions (`DISALLOW_INSTALL_APPS`, unknown sources) —
  https://developer.android.com/reference/android/os/UserManager
- Managing/removing device policy over ADB (`dpm`, `dumpsys device_policy`) —
  https://developer.android.com/tools/adb
- Knox Mobile Enrollment auto re-enroll — https://docs.samsungknox.com/admin/knox-mobile-enrollment/faq/
