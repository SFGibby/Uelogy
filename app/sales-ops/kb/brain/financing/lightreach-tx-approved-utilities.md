---
title: LightReach won't show TPO pricing in TX (CPS Energy, other non-approved utilities)
systems: [Enerflo, LightReach]
category: financing
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [lightreach, tpo, texas, cps-energy, avl, utility]
seen_in: [2026-01-16]
---

## Symptom
Rep in TX tries to show TPO pricing via LightReach (or GoodLeap) and no pricing appears regardless of panel selection. Customer is often on CPS Energy or a similar municipal utility.

## Likely Cause
- LightReach's TX approved-utility list is narrow. Per PLD 2026-01-16: LR in TX approves Oncor, CenterPoint, AEP, and a few other small municipal services — CPS Energy is NOT approved.
- GoodLeap was not enabled in TX at the time of incident (per DKD 2026-01-16).
- Enerflo's generic "lending options available" indicator does not reflect LR's per-utility AVL.

## Resolution
1. Ask the rep which utility the customer is actually on (pull from the UB).
2. Cross-check against LightReach's current TX AVL (Oncor, CenterPoint, AEP, + small munis per 2026-01-16).
3. If the utility is not approved, tell the rep to pivot to cash/loan — do not chase a LR TPO for that customer.
4. If the utility IS approved but still no pricing appears, retry after refresh and then file an Enerflo ticket.
5. Escalate. <!-- TODO: Sam to confirm LightReach AVL owner -->

## Related
- `brain/utility-data/lightreach-approved-utility-mismatch.md`
- `brain/financing/goodleap-tpo-ca-failures.md`
