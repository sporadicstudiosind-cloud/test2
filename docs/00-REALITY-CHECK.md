# 00 — Reality check (read this first)

You asked to "install a much better OS." Before any tool runs, here is the honest
engineering picture of what stands in the way, why, and where the *achievable* win
actually is. I'd rather you be annoyed at me now than bricked and disappointed later.

## Your exact device

- **Marketing name:** Gabb Phone Plus (the A10e-based Gabb phone, the "Phone 2" era).
- **Hardware:** Samsung Galaxy A10e.
- **Model (from the back of your unit):** `SM-A102U1` — the US, carrier-unlocked variant.
- **SoC:** Exynos 7884 (14 nm), 2 GB RAM, 32 GB storage.
- **Android:** shipped Android 9 (One UI 1.1), last official is **Android 11 / One UI 3.1**.

Write your model down. Every decision below forks on `A102U1` vs anything else.

## Three different "locks" — don't confuse them

The internet blurs these constantly. They have different owners and different fixes:

| Lock | Who controls it | What it stops | Your situation |
|---|---|---|---|
| **SIM / carrier lock** | the carrier (Gabb/Verizon MVNO) | using another carrier's SIM | Not your blocker — you want to change the *OS*, not the SIM. |
| **Bootloader lock** | Samsung + carrier policy | flashing *custom* / unsigned OSes (LineageOS, GSI, TWRP) | **The wall in front of "custom OS".** |
| **Gabb software / Knox MDM** | Gabb (via Samsung Knox) | Play Store, sideloading, settings — the "kid phone" cage | **This is what you actually want gone.** |

The key realization: **removing the Gabb cage does NOT require breaking the bootloader
lock.** They're separate problems. That's why "de-Gabb to stock Android" is feasible
even though "install LineageOS" probably isn't.

## Why a custom OS is (almost certainly) blocked on `SM-A102U1`

A custom OS requires an **unlocked bootloader**, which requires the **"OEM Unlocking"**
toggle in Developer Options. On US Samsung models this toggle is typically **absent or
permanently greyed out**:

1. **US-market policy.** The tidy rule "Exynos = unlockable, Snapdragon US = locked" is
   real but *incomplete*: the unlockable Exynos phones were the **international** ones.
   US models (numbers ending **`U` / `U1` / `W`**) ship with OEM Unlock removed by
   carrier/firmware policy regardless of chipset. ([The Custom Droid guide](https://www.thecustomdroid.com/samsung-galaxy-bootloader-unlock-guide/))
2. **Gabb's Knox layer.** Gabb enrolls the phone in **Samsung Knox** (Knox Manage /
   Knox Mobile Enrollment, domain `corp.gabbwireless.com`) and it typically sits in
   **KG state "Prenormal"**, a state whose *entire purpose* is to remove OEM Unlock and
   block non-approved software. ([KG/RMM explainer](https://www.thecustomdroid.com/prenormal-rmm-state-on-samsung-galaxy-guide/), [Samsung Knox](https://en.wikipedia.org/wiki/Samsung_Knox))
3. **The trend is one-way.** Samsung has been *removing* bootloader unlock across the
   board (later One UI builds drop it even where it used to exist). Nothing about this
   gets easier over time. ([2025–26 unlock reality check](https://electronics.alibaba.com/question/samsung-bootloader-unlock-reality-check-step-by-step-guide))

**Counterpoint, stated fairly** (because you asked me not to be a yes-man): people *have*
put LineageOS/GSIs on "an A10." Look closely and it's almost always the **`SM-A105`**
(international Galaxy A10) or a non-US A10e — a *different device* in the same marketing
family, one that exposes OEM Unlock. That evidence does **not** transfer to `A102U1`.
Custom ROM listings that say "a10" mean the `a105` codebase, not `a102`. ([custom ROM list](https://customrombay.org/samsung-a10/))

**The only honest way to know for sure on YOUR unit:** run `scripts/01-detect.sh` and
look in Developer Options. If "OEM Unlocking" is missing/greyed, the custom-OS path is
closed and no software on the running system can reopen it — the gate is below it.

## So what *can* you actually get?

The realistic, supported outcome is **plain, un-Gabb'd Android 11**: full Samsung One UI,
Play Store, normal apps, no Gabb launcher/restrictions. You get there by **flashing
Samsung's own signed stock firmware** — an operation the *locked* bootloader explicitly
permits, because the firmware is signed by Samsung. That's `docs/02-DEGABB-stock-firmware.md`.

Think about whether that actually satisfies your real goal. You said the priority is
"remove Gabb's limits." Plain stock Android 11 does exactly that. "A much better OS" was
the *assumed means*; a de-Gabb'd normal Android might be the *actual end* you wanted.

## The catch that ruins naive attempts: Knox Mobile Enrollment

Even a perfect stock reflash can **re-download Gabb's management on first boot**, because
KME-registered devices **auto-re-enroll after a factory reset / reflash** by phoning
Samsung's servers. If Gabb still has your IMEI assigned to a profile, the cage comes back.
([KME behavior](https://docs.samsungknox.com/admin/knox-mobile-enrollment/faq/))

The clean fix is **official**: have Gabb **release / de-enroll** the device from their
Knox console. Since your line is cancelled and the phone is paid off, you have standing
to request it. Details and the "what if they won't" fallbacks are in
`docs/03-KNOX-KME-caveat.md` — **read it before flashing.**

## Decision tree

```
Run scripts/01-detect.sh
        │
        ├─ "OEM Unlocking" present & toggleable?
        │        ├─ YES (rare on A102U1) ──► docs/04-custom-os-IF-unlockable.md  (LineageOS/GSI possible)
        │        └─ NO  (expected)        ──► custom OS is OFF the table. Continue ▼
        │
        ├─ Want Gabb gone? ──► docs/03-KNOX-KME-caveat.md  (settle KME FIRST)
        │                        └─► docs/02-DEGABB-stock-firmware.md  (reflash clean Android 11)
        │
        └─ Just exploring ──► docs/01-DIAGNOSE.md + docs/05-GLOSSARY.md
```

## Sources

- Samsung bootloader unlock support by region/chipset — https://www.thecustomdroid.com/samsung-galaxy-bootloader-unlock-guide/
- KG / RMM "Prenormal" state — https://www.thecustomdroid.com/prenormal-rmm-state-on-samsung-galaxy-guide/
- Samsung Knox overview — https://en.wikipedia.org/wiki/Samsung_Knox
- Knox Mobile Enrollment FAQ (auto re-enroll) — https://docs.samsungknox.com/admin/knox-mobile-enrollment/faq/
- 2025–26 unlock reality check — https://electronics.alibaba.com/question/samsung-bootloader-unlock-reality-check-step-by-step-guide
- Galaxy A10e specs — https://en.wikipedia.org/wiki/Samsung_Galaxy_A10e
- Gabb + Knox (community) — https://discussions.gabb.com/discussion/1147/how-to-fix-gabb-phone-stuck-on-knox-manage
- Custom ROM list for "a10" (=a105) — https://customrombay.org/samsung-a10/
