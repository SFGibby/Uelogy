---
title: Aurora design won't sync back to Enerflo (no consumption profile / blank equipment)
systems: [Enerflo, Aurora]
category: design-tools
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [aurora, design-sync, consumption-profile, offset, equipment-list]
seen_in: [2025-11-19, 2025-12-09, 2025-12-15, 2026-01-14]
---

## Symptom
Rep finishes a design in Aurora and tries to sync it to Enerflo. Any of: sync fails with an error, offset does not carry over, or the equipment list shows blank in Enerflo. Sometimes rep also sees "self design only" with no option to request a design from the design team.

## Likely Cause
- No consumption profile was set on the design before it was opened in Aurora. Multiple resolved threads (DKD) show the fix was simply adding a consumption profile or correcting one with 0 monthly consumption.
- Rep is logged into the wrong Aurora account (see `brain/account-access/aurora-login-wrong-email-after-ambia-switch.md`).
- Active Aurora outage affecting some territories (Aurora confirmed at least one such outage during this period).
- Wrong panel module selected in Aurora so Enerflo can't match equipment (see `brain/panels-equipment/qtron-430-duplicate-in-aurora.md`).

## Resolution
1. Open the deal in Enerflo and confirm a consumption profile exists with non-zero monthly usage. If not, create / fix it first, then re-open the design in Aurora.
2. Have the rep click "Sync" in the Aurora design pane and watch for specific errors.
3. If error persists, verify the rep is logged into the correct Aurora account (manually type email, ignore autofill).
4. Check if there is an active Aurora outage before escalating as a one-off.
5. Confirm the selected panel module is the Enerflo-linked variant (see related).
6. If none of the above resolves it, escalate with the deal link and Aurora design URL. <!-- TODO: Sam to confirm escalation owner for Aurora sync -->

## Related
- `brain/account-access/aurora-login-wrong-email-after-ambia-switch.md`
- `brain/panels-equipment/qtron-430-duplicate-in-aurora.md`
- `brain/utility-data/utility-missing-from-enerflo-dropdown.md`
