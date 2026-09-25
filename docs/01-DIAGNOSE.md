# 01 — Diagnose your actual device state

The whole toolkit forks on facts only *your* phone can tell you. This chapter gets those
facts two ways: over ADB (while Android is running) and in Download Mode (the bootloader's
own status screen, which can't lie to you).

## Part A — Enable ADB on the Gabb phone

Gabb hides Settings, so this can be fiddly. General Samsung/Android steps:

1. **Open Settings.** On a locked-down Gabb launcher, Settings may be reachable via the
   quick-settings gear (swipe down from the top), or by tapping the time/date, or through
   the phone's Accessibility shortcut. If Gabb has fully hidden it, you may only be able
   to do the Download-Mode read in Part B until after a reflash.
2. **Settings → About phone → Software information.**
3. Tap **Build number** seven times until it says "Developer mode has been enabled."
4. Back out to **Settings → Developer options**.
5. Turn on **USB debugging**.
6. **Look for "OEM unlocking" in this same screen. This single toggle decides whether a
   custom OS is even possible.** Note its state:
   - **Missing entirely** → US/Gabb policy locked it out. Custom OS = closed.
   - **Present but greyed out** with "Bootloader is already unlocked" → rare.
   - **Present, greyed**, sometimes with a note about network/Knox → often KG-state gated.
   - **Present and toggleable** → the door *might* be open; see `04-custom-os-IF-unlockable.md`.
7. Plug the phone into your computer. On the phone, approve the "Allow USB debugging?"
   RSA prompt (check "always allow").

## Part B — Read the bootloader's own status (Download Mode)

This screen is authoritative — it's below Android, so Gabb can't dress it up.

1. Power the phone **off** completely.
2. Hold **Volume Up + Volume Down together**, then **plug in the USB cable** to a
   computer (A10e has no dedicated combo beyond this — the cable is what powers it into
   the bootloader). Keep holding until a blue/warning screen appears.
3. Press **Volume Up** to continue into **Download / Odin mode** (you are NOT flashing —
   you're just reading the text).
4. Read the fields shown, especially:
   - **OEM LOCK: ON / OFF** — ON means bootloader locked.
   - **KG STATE:** `Checking / Prenormal / Normal / Locked` — *Prenormal* or *Locked*
     means Knox is actively gating unlock (Gabb's management).
   - **RMM STATE / Warranty Bit / Carrier.**
5. Photograph this screen. It's your ground truth.
6. To leave without flashing: hold **Volume Down + Power ~7–10 s** to reboot.

Interpretation:

| You see | Meaning |
|---|---|
| `OEM LOCK: ON` and no OEM-Unlock toggle in dev options | Bootloader locked, no supported unlock → **custom OS closed**, stock reflash still OK |
| `KG STATE: Prenormal` / `Locked` | Knox/Gabb management active → settle KME (`03`) before you rely on anything |
| `KG STATE: Checking` | Not yet contacted Knox server; can change after it goes online |

## Part C — Run the detector

With USB debugging approved and the phone booted normally:

```bash
./scripts/00-check-prereqs.sh   # make sure adb etc. exist
./scripts/01-detect.sh          # fingerprint + verdict
```

`01-detect.sh` reads (read-only, changes nothing):

- `ro.product.model`, `ro.product.device`, `ro.build.version.release`, build fingerprint
- carrier/CSC (`ro.boot.carrierid`, `ril.official_cscver`, `ro.csc.sales_code`)
- **OEM-unlock signals**: `sys.oem_unlock_allowed`, `ro.oem_unlock_supported`,
  `settings get global oem_unlock_supported`
- **Knox signals**: `ro.boot.warranty_bit`, `ro.warranty_bit`, `ro.boot.flash.locked`,
  presence of Knox/Gabb packages (`pm list packages | grep -Ei 'knox|gabb|sec_container'`)

It prints a plain-English verdict and points you to the right `docs/` path.

## What to do with the verdict

- **OEM unlock looks available** → `docs/04-custom-os-IF-unlockable.md` (test it carefully).
- **OEM unlock unavailable (expected)** → the custom-OS dream is closed; go remove Gabb the
  supported way: `docs/03-KNOX-KME-caveat.md` **then** `docs/02-DEGABB-stock-firmware.md`.
- **Can't even reach ADB** (Gabb hid Settings) → you can still reflash from Download Mode;
  jump to `02`, but read `03` first about re-enrollment.
