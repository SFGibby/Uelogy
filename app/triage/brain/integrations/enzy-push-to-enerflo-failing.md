---
title: Enzy appointment not pushing to Enerflo (link dead-ends or duplicates)
systems: [Enzy, Enerflo]
category: integrations
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill (Yan / Kerstin at Sunder own Enzy per 2026-01-15 thread) -->
tags: [enzy, enerflo, push, appointment, sunder]
seen_in: [2025-12-18, 2026-01-15, 2026-01-22]
---

## Symptom
Rep books an appointment in Enzy but:
- Clicking "Open in Enerflo" restarts the whole design process from title check.
- New closers assigned later cannot see the prior Aurora design.
- Some Enzy appointments never create a corresponding Enerflo deal at all, forcing reps to manually create.
- Errors on deal creation from Enzy (address-related, on 2025-11-25 it was resolved by CCE fixing address).

## Likely Cause
- The Enzy → Enerflo push integration is owned by Sunder (Yan, Kerstin, Devon per CCE 2025-12-18). Internal Virtual Sales support cannot directly fix Enzy-side bugs.
- Permission / authorization gating: some 1099 / new reps don't have Enerflo authorization yet, and when Enzy tries to push a lead it errors (RLG 2025-12-10 on Garrett Mendelsohn).
- Address validation inside Enerflo on new-deal creation sometimes blocks until Alec Potter / admin clears it.

## Resolution
1. First check: is the rep fully onboarded and authorized in Enerflo? If not, fix that first.
2. Ask the rep to send BOTH the Enzy link and the expected Enerflo deal URL. Send to CCE or PID.
3. For Enzy-side bugs (push not firing, upload errors, search issues), message Yan or Kerstin directly — CCE 2026-01-15: "I unfortunately don't have access to help with that. Kerstin and Yan will be the ones to contact for Enzy issues."
4. Workaround: manually create the deal in Enerflo from the Enzy customer details so the rep isn't blocked. Coordinate so it doesn't create a duplicate.
5. Escalate. <!-- TODO: Sam to confirm current escalation contact at Sunder for Enzy integration -->

## Related
- `brain/account-access/rep-not-authorized-in-enerflo.md`
- `brain/integrations/enzy-pdf-upload-rejected.md`
