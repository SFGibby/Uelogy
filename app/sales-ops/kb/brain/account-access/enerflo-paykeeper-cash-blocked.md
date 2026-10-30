---
title: Paykeeper (cash / escrow) won't process through Enerflo
systems: [Enerflo, Paykeeper]
category: account-access
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [paykeeper, cash, escrow, contract, manual]
seen_in: [2025-12-04, 2025-12-08, 2026-01-07, 2026-01-23, 2026-01-26]
---

## Symptom
Rep tries to run a cash deal using Paykeeper inside Enerflo and gets an error, either on financing selection ("getting this error when I use paykeeper") or when trying to send for signature. Reps describe Paykeeper "not working through enerflo" on multiple dates.

## Likely Cause
- Paykeeper is incompletely wired into Enerflo. Per CKF 2026-01-07: "Paykeeper does not work through enerflo. The only thing we can do in enerflo is build a prop."
- Sometimes triggered by a missing homeowner email (CCE 2025-12-04 initially suspected — but rep confirmed email was correct and error persisted).
- Cases with cash + IL SREC path: selecting cash with Paykeeper errors, switching to loan clears the error (ATP 2026-01-16).

## Resolution
1. Double-check the homeowner email field is populated and valid.
2. If Paykeeper still errors, submit the project and ask the support line to create the cash contract manually (per CCE 2025-12-04: "skip it for now. Submit the project and ask the support line to help create it manually").
3. For IL SREC cash deals: try marking the proposal as loan temporarily to clear the SREC calc, then coordinate manual Paykeeper contract.
4. Do NOT tell the rep Paykeeper is fully functional — it is known to be partial. Set expectations.
5. Escalate. <!-- TODO: Sam to confirm who owns the Paykeeper integration work in Enerflo -->

## Related
- `brain/enerflo-pricing/battery-only-deal-not-supported.md`
- `brain/policy-process/il-shines-srec-enerflo-pending.md`
