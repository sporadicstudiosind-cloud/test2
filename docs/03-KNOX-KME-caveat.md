# 03 — The Knox / KME catch (settle this BEFORE flashing)

This is the chapter that decides whether a reflash actually frees the phone or just makes
Gabb reappear on first boot. Do not skip it.

## The trap

**Knox Mobile Enrollment (KME)** ties a device's IMEI/serial to an organization's MDM
profile *on Samsung's servers*. Its defining feature: an enrolled device **automatically
re-enrolls after a factory reset — and after a firmware reflash** — the moment it gets
online during the out-of-box setup. ([Samsung KME FAQ](https://docs.samsungknox.com/admin/knox-mobile-enrollment/faq/))

So if Gabb still has your `SM-A102U1`'s IMEI assigned to a profile in their Knox console,
you can flash pristine stock Android, boot it, connect to Wi-Fi — and Gabb's management
downloads itself right back. The reflash was technically perfect and you're still caged.

This is *by design* and is **not something a bypass tool reliably defeats** on this model.
The lever that actually works is getting the IMEI **released** from the org's console —
which only the org (Gabb) or Samsung can do.

## The correct, boring, effective fix: request a release

Because your line is **cancelled and the phone is paid off**, you have standing to ask.

1. **Find your IMEI:** dial `*#06#`, or read it off the sticker under the battery cover /
   in Download Mode, or the box. (Your unit's is partially visible on the back label.)
2. **Contact Gabb support** (chat/phone/email via https://gabb.com/support/). Ask them to:
   - **cancel/close** the line if not already (confirm no financing balance), and
   - **release the device** and **remove it from Knox Mobile Enrollment / Knox Manage**
     so it will not re-enroll.
   - Note: Gabb documents a formal **"release"** that *removes Gabb software so the
     underlying Samsung device can be used elsewhere* — but their published policy ties
     the self-serve release to **Gabb Phone 3 Pro / 4 Pro**. The A10e-based Plus may not
     have the same self-serve flow, so you may need to ask an agent to do the KME removal
     manually. Be persistent and specific: say "please remove IMEI ##### from Knox Mobile
     Enrollment." ([Gabb cancel/release policy](https://gabb.com/support/en/articles/11164702-how-to-cancel-a-gabb-line))
3. **Get confirmation** that it's deregistered before you rely on the reflash being permanent.

## How to tell if KME will re-grab the phone

- In Download Mode, **`KG STATE: Prenormal` or `Locked`** = Knox is actively managing →
  KME is very likely still in play.
- After you *think* it's released, a safe test: reflash (or just factory reset), then during
  setup **connect to Wi-Fi and wait**. If no "This device is managed by Gabb / Knox Manage"
  enrollment appears after a few minutes and a reboot, you're clean. If it does, it's still
  registered — go back to Gabb.

## Fallbacks if Gabb won't/can't release it (honest options, and their limits)

None of these are magic; I'm listing them so you can weigh them, not because they're clean.

1. **Stay offline through setup, then use it half-caged.** If you complete the OOBE with no
   network, KME can't phone home, so management doesn't apply *yet* — but it can trigger the
   instant you ever connect. This gives you a working-ish device only if you keep it offline,
   which defeats the point. Not a real fix.
2. **Escalate at Samsung.** Samsung Knox support can, in principle, remove a device from an
   organization's KME, but they generally route you back to the enrolling org (Gabb). Worth a
   call if Gabb stonewalls; bring proof of ownership/payoff.
3. **Time / EOL.** If Gabb ever deletes the profile or stops paying for Knox, enrollment
   stops applying. Not something you can force.

What I won't hand you is a "KG Prenormal bypass" / Knox-defeat utility. On `A102U1` they
mostly don't work, they can hard-brick or trip the Knox fuse permanently, and if the device
is genuinely still enrolled, the *right* answer is the release above — not defeating a
security control. If your goal is a clean, dependable phone, the release is the path.

## Order of operations

```
1. Confirm line cancelled + device paid off.               (you: done)
2. Get Gabb to release device + remove from KME.  ◄── DO THIS FIRST
3. Confirm deregistration.
4. THEN reflash stock firmware  (docs/02-DEGABB-stock-firmware.md).
5. Set up offline once to verify no re-enroll, then go online.
```

Doing step 4 before step 2 usually means doing step 4 twice.

## Sources
- Knox Mobile Enrollment FAQ (auto re-enroll after reset) — https://docs.samsungknox.com/admin/knox-mobile-enrollment/faq/
- Gabb cancel / device release policy — https://gabb.com/support/en/articles/11164702-how-to-cancel-a-gabb-line
- Gabb stuck-on-Knox-Manage (community) — https://discussions.gabb.com/discussion/1147/how-to-fix-gabb-phone-stuck-on-knox-manage
