---
title: IL Shines / SREC incentives not reflected in Enerflo IL deals
systems: [Enerflo]
category: policy-process
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [il-shines, srec, illinois, rebate, hic]
seen_in: [2026-01-12, 2026-01-13, 2026-01-22, 2026-01-23]
---

## Symptom
Rep working an IL deal cannot see SREC / power-company incentives in Enerflo, or the SREC section shows as red / errors. Customer-facing HIC and proposal need to show net system cost after SREC rebate — without it the rep cannot price the deal.

## Likely Cause
- The IL Shines SREC calculation is being built / fixed inside the Ambia Enerflo instance. Per PID 2026-01-13: "We are getting close" (they thought they were close 2026-01-13 and discovered the calc itself was wrong). IL Shines had NOT yet launched cleanly as of 2026-01-22.
- A separate one-time "Derek Downs rebate" left enabled briefly showed up on new deals (2026-01-22); Phil disabled it — this is NOT the SREC fix, just a stale rebate record.

## Resolution
1. Confirm the deal is actually in IL and uses a utility eligible for IL Shines.
2. Check whether IL Shines has shipped — if still pending (pre-2026-01-22), the workaround is to pause IL apps until it's live OR run the SREC calc manually and annotate the HIC.
3. If SREC section throws a red error even after it should be working, try switching financing between cash/Paykeeper and loan — sometimes the SREC path is only active under certain financing types.
4. If a one-time rebate shows up unexpectedly on a new deal, ping Phil / Derek — they can disable stale rebate records.
5. Escalate. <!-- TODO: Sam to confirm current status of IL Shines Enerflo integration -->

## Related
- `brain/account-access/enerflo-paykeeper-cash-blocked.md`
- `brain/policy-process/il-contractor-license-required.md`
