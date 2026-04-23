---
title: Utility appears green in Enerflo but LightReach rejects at proposal
systems: [Enerflo, LightReach]
category: utility-data
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [lightreach, tpo, approved-utility, avl]
seen_in: [2025-11-11, 2025-11-20, 2025-12-08, 2025-12-11]
---

## Symptom
Utility shows as a valid (green) option in the Enerflo consumption / financing flow, but when the rep tries to create a LightReach proposal they get an error. Examples observed: Seattle City Light (WA), Fayetteville Public Works Commission (NC), various CA utilities, and an Illinois example where LightReach simply "won't work".

## Likely Cause
- Enerflo does not validate the utility against the LightReach API until the proposal-creation step, so the "green light" in earlier stages is misleading.
- LightReach's approved-utility list is state-specific and narrower than Enerflo's dropdown. E.g. in NC, LightReach only allows Duke Energy Progress or Duke Energy Carolinas.
- In some states (notably CA) the LightReach AVL is so narrow that certain utilities additionally require a battery attached.

## Resolution
1. Confirm the customer's utility against the current LightReach approved-utility list for that state before committing to a TPO path.
2. If the utility is not on LightReach's AVL, pivot the deal to a different financing product (cash / loan / GoodLeap / Sungage) — do not try to force the TPO.
3. For suspected API-validation bugs (utility SHOULD be approved but errors out), file an Enerflo ticket with the deal link and a screenshot of the error.
4. If a battery is required by LightReach for that utility, add one before retrying.
5. Escalate. <!-- TODO: Sam to confirm who owns LightReach AVL sync with Enerflo -->

## Related
- `brain/utility-data/utility-missing-from-enerflo-dropdown.md`
- `brain/financing/goodleap-tpo-ca-failures.md`
