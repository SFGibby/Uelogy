---
title: Sungage / Palmetto / LightReach login fails due to +sp vs +ambia email mismatch
systems: [Enerflo, Sungage, Palmetto, LightReach]
category: account-access
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [sungage, palmetto, lightreach, email-mismatch, plus-sp, plus-ambia]
seen_in: [2026-04-14, 2026-04-15, 2026-04-21]
---

## Symptom
Rep tries to run financing (Sungage, Palmetto, or LightReach) from Enerflo and gets one of: "invalid credentials", a verification-loop asking to re-verify the account, or projects simply not pulling up in the financing partner's portal.

## Likely Cause
- The rep's Enerflo email does not match the email the financing partner has on file. Observed pattern: Enerflo is on `first.last@sunpower.com` while the partner account is under `first.last+sp@sunpower.com` (or the old `+ambia` variant).
- The rep's browser is logged into the partner portal directly with an old Ambia-era account, so new Enerflo hand-offs route them into the wrong session.

## Resolution
1. Ask the rep which email their partner portal account was created under (check Sungage / Palmetto / LightReach onboarding emails).
2. Have them fully log out of the partner portal in their browser (e.g. https://partners.sungage.com/) before retrying from Enerflo.
3. If emails mismatch, update the partner-side email to match Enerflo (or vice versa). Per observed 2026-04-15 resolution: telling the rep to log in with the `+sp@sunpower.com` variant fixed it. Per 2026-04-21 Palmetto example, the fix was to issue a new Palmetto invite with the matching email.
4. For new reps with no prior projects, simply re-issuing the partner invite to the correct matching email is the cleanest fix.
5. Do NOT change the Enerflo email on an established rep without confirming downstream impact.
6. Escalate. <!-- TODO: Sam to confirm who owns cross-system email reconciliation -->

## Related
- `brain/account-access/aurora-login-wrong-email-after-ambia-switch.md`
