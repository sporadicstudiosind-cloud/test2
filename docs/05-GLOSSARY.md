# 05 — Glossary

Plain-English definitions so the other docs don't gaslight you with acronyms.

- **ADB (Android Debug Bridge):** USB/host tool to talk to Android while it's running.
  Read-only here — we use it to fingerprint the device.

- **Bootloader:** the first code that runs at power-on; it decides what OS is allowed to
  boot. A **locked** bootloader only boots software signed by Samsung. This lock is *below*
  Android, so nothing you install in Android can remove it.

- **OEM Unlocking:** a Developer-Options toggle that, when present and enabled, lets you
  unlock the bootloader. On US Samsung models (`U`/`U1`/`W`) it's usually absent. **Its
  presence is the single fact that decides whether a custom OS is possible.**

- **Download Mode / Odin Mode:** Samsung's flashing mode, entered from power-off with
  Volume Up+Down + cable. Shows authoritative lock/Knox status and accepts firmware flashes.

- **Odin:** Windows tool (Samsung's protocol) for flashing signed firmware. Most reliable.

- **Heimdall:** open-source cross-platform equivalent of Odin. Fiddlier; scripted in this repo.

- **Stock firmware:** Samsung's official, cryptographically **signed** OS build. A locked
  bootloader accepts it — which is why you can de-Gabb without unlocking anything.

- **CSC:** Consumer Software Customization — the region/carrier code (e.g. `XAA` = US generic)
  bundled in firmware. **CSC** file wipes data; **HOME_CSC** keeps it.

- **Knox:** Samsung's hardware+software security platform. Enables enterprise management and
  a one-time **warranty fuse** ("Knox tripped") that unlocking custom binaries burns.

- **Knox Manage:** Samsung's MDM (mobile device management) console. Gabb uses it to enforce
  the "kid phone" restrictions (`corp.gabbwireless.com`).

- **KME (Knox Mobile Enrollment):** ties an IMEI to an org's MDM profile *on Samsung's
  servers*, and **auto-re-enrolls after factory reset/reflash**. The reason a perfect
  reflash can still bring Gabb back. Fixed by the org **releasing** the device.

- **KG State (Knox Guard State):** shown in Download Mode. `Normal` = free; **`Prenormal`**
  or **`Locked`** = Knox is actively gating unlock/flashing (typical on managed/Gabb units).

- **RMM (Remote Monitoring & Management) / RMM State:** older name for the same
  finance/enterprise lock mechanism; `Prenormal` behaves the same way.

- **VaultKeeper:** Samsung service that can *re-lock* the bootloader if it decides an unlock
  wasn't sanctioned. Common failure point on US/managed units even when a toggle appears.

- **FRP (Factory Reset Protection):** ties the device to the last Google account after a
  reset. Unrelated to Gabb, but can block setup if you reset without removing the account —
  remove your Google account before wiping.

- **GSI (Generic System Image):** an AOSP/LineageOS system image built to the generic
  Treble interface, flashable on many devices' `system` partition. The realistic custom-OS
  option for an A10e *if* the bootloader ever unlocks — with rough edges.

- **Treble:** Android's split between the OS and vendor/hardware layer that makes GSIs
  possible. A10e's Treble support is partial.

- **Brick:** a phone that won't boot. **Soft brick** = recoverable by reflashing stock.
  **Hard brick** = no Download Mode, effectively dead. Hard brick is the risk you accepted.
