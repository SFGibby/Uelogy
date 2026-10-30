---
title: Aurora errors from Enerflo after Ambia-to-SunPower email switch
systems: [Enerflo, Aurora]
category: account-access
owner: Onboarding
escalate_to: <!-- TODO: Sam to fill (DKD / Derek Downs appears to handle Aurora invites in transcript — confirm) -->
tags: [aurora, login, ambia, sunpower, autofill, sync]
seen_in: [2025-12-08, 2025-12-09]
---

## Symptom
Rep opens a deal in Enerflo, clicks into design / Aurora, and hits an error — either cannot open design mode, cannot build a design, or can build in Aurora but cannot sync back to Enerflo. Rep insists they are using the correct login.

## Likely Cause
- Browser autofill is silently logging them into an old Ambia-era Aurora account rather than the new SunPower account. (Per DKD 2025-12-09: "ive had 4 sales reps say that and all 4 weren't. Autofill logins can be a bitch.")
- Rep was never sent the new Aurora invite email (or it went to the wrong address).
- Email handle mismatch between Enerflo and Aurora — e.g. Enerflo uses `first.last@sunpower.com` while Aurora expects `first.last+ambia@sunpower.com` or `first.last+sp@sunpower.com`.

## Resolution
1. Have the rep fully log OUT of Aurora in a new browser window and manually type the correct email — do not rely on autofill.
2. Confirm which email their Aurora account is under (often the `+ambia@sunpower.com` or `+sp@sunpower.com` variant, not the plain `@sunpower.com`).
3. If no Aurora invite was ever received, re-send the invite to the correct email. <!-- TODO: Sam to confirm who currently sends Aurora invites post-onboarding -->
4. If login is correct but Enerflo still errors on sync, check for an active Aurora outage first (see 2025-12 outage note — Aurora confirmed an outage affecting some territories).
5. If still broken, escalate with the deal link + rep's email + screenshot of the error.

## Related
- `brain/design-tools/aurora-design-not-syncing-to-enerflo.md`
- `brain/account-access/sungage-email-plus-sp-mismatch.md`
