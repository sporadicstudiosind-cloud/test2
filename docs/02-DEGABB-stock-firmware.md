# 02 — De-Gabb: reflash clean stock Samsung Android (main path)

This is the achievable win: replace Gabb's customized software with **Samsung's own
signed stock firmware**, giving you plain Android 11 / One UI 3.1 with Play Store and
normal apps. It needs **no bootloader unlock** because the firmware is Samsung-signed —
the locked bootloader accepts it.

> ⛔ **STOP** — do `docs/03-KNOX-KME-caveat.md` first. If the IMEI is still in Gabb's Knox
> Mobile Enrollment, this reflash will look perfect and then Gabb re-installs itself on
> first boot. Settle the release before spending an hour here.

> 💣 This **erases everything** on the phone and can **brick it** if you flash the wrong
> firmware or interrupt it. You accepted that. Right firmware = right model + right region.

## Two toolchains

| Tool | OS | Reliability on Samsung | Notes |
|---|---|---|---|
| **Odin** | Windows only | Highest (Samsung's own protocol, community build) | Recommended if you have any Windows machine. Point-and-click. |
| **Heimdall** | Linux / macOS / Windows | Good, but fiddlier | Open source. This repo's `03-flash-stock.sh` wraps it. |

If you have access to Windows at all, **Odin is the safer bet** for a first-timer. The
scripts here are the Linux/Heimdall route because that's cross-platform and scriptable.

## Step 1 — Download the correct stock firmware

You need firmware matching **`SM-A102U1`** and your region/carrier code (**CSC**). For the
US unlocked unit the common CSC is **`XAA`** (generic US). `01-detect.sh` prints your CSC.

Use an open-source downloader (pulls straight from Samsung's servers, decrypts + extracts):

```bash
# Option A: samfirm.js (Node)
npx samfirm -m SM-A102U1 -r XAA

# Option B: samloader (Python) — see scripts/02-download-firmware.sh for a guided run
```

`scripts/02-download-firmware.sh` wraps this, checks the model/region, and tells you what
it downloaded. A full firmware is a ZIP containing several `*.tar.md5` files:

```
AP_*.tar.md5     # main system (Android itself)
BL_*.tar.md5     # bootloader
CP_*.tar.md5     # modem/radio
CSC_*.tar.md5    # region config + WIPES data (full clean)
HOME_CSC_*.tar.md5  # region config, KEEPS data (don't use for a clean de-Gabb)
```

For a clean de-Gabb you want the **CSC** (wiping) file, not HOME_CSC.

> Match the model **exactly**. `A102U1` firmware on an `A102U` (or vice versa), or a wrong
> region, is how phones get bricked. When unsure, pick the firmware whose version string
> your device already reports (from `01-detect.sh`) or a newer official one for the same
> model+CSC.

## Step 2 — Verify, then flash

### Odin path (Windows) — recommended for reliability
1. Install Samsung USB drivers + Odin3 (community).
2. Boot phone to Download Mode (see `01-DIAGNOSE.md` Part B).
3. In Odin: **BL**→BL file, **AP**→AP file, **CP**→CP file, **CSC**→the *CSC* (wiping) file.
4. **Options:** leave *Re-Partition* OFF; *Auto Reboot* + *F. Reset Time* ON.
5. **Start.** Wait for **PASS**. Don't unplug mid-flash.

### Heimdall path (Linux/macOS) — this repo's scripts
```bash
# Dry run first: prints exactly what it WOULD flash, changes nothing.
./scripts/03-flash-stock.sh --firmware-dir ~/Downloads/SM-A102U1_XAA

# When you've read the plan and the device is in Download Mode:
./scripts/03-flash-stock.sh --firmware-dir ~/Downloads/SM-A102U1_XAA --flash
```
The script extracts the `.tar.md5`s, decompresses the `.lz4` partition images, reads the
device **PIT** so partition names match, and builds the `heimdall flash` command. It will
**not** flash without `--flash`.

## Step 3 — First boot (the verification)

1. Let it boot (first boot after a full flash is slow — can be 5–10 min).
2. **Set it up with NO network first.** Skip Wi-Fi, skip SIM data.
3. Watch for any "managed by Gabb / Knox Manage" enrollment. If none appears after setup
   and a reboot, KME is clear.
4. *Now* connect to Wi-Fi. If it stays clean, you're done — plain Android 11, Play Store,
   the works. If Gabb reappears, the IMEI is still enrolled → back to `03-KNOX-KME-caveat.md`.

## If flashing itself fails

- **"SW REV CHECK FAIL" / anti-rollback:** you tried older firmware than what's on the phone.
  Use the same or newer version for `A102U1`. Bootloader/modem can't be downgraded past the
  anti-rollback counter.
- **"Custom binary blocked by FRP/OEM lock":** you tried to flash something *unsigned*
  (e.g. TWRP). Stock signed firmware won't hit this; a custom image will — which is exactly
  why custom OS needs the bootloader unlock you (probably) don't have.
- **Heimdall "detect" finds nothing:** udev rules / cable / not in Download Mode. See
  `00-check-prereqs.sh` output and try a different USB cable/port (USB 2.0 ports are more
  reliable for this).
- **Stuck / soft-bricked:** re-enter Download Mode and reflash the full firmware again. A
  full 4-file flash usually recovers a soft-brick. A *hard* brick (no Download Mode) is the
  real risk you accepted.

## Sources
- Flashing Samsung stock via Heimdall on Linux — https://xdaforums.com/t/flash-samsung-stock-firmware-custom-recovery-or-kernel-using-heimdall-macos-linux-samsung-galaxy-s23.4682100/
- Heimdall extract/lz4 workflow — https://gist.github.com/wendimust/0fb7c71cf6da0bb44a018f7eba356c83
- samfirm.js firmware downloader — https://github.com/jesec/samfirm.js/
- Odin stock-flash overview — https://www.droidviews.com/install-stock-firmware-on-samsung-galaxy-devices-using-odin/
