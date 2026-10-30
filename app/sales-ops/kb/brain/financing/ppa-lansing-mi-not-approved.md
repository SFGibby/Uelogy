---
title: PPA fails in MI for Lansing Power & Light (not on Palmetto active-utilities list)
systems: [Enerflo, Palmetto]
category: financing
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [palmetto, ppa, michigan, lansing, avl]
seen_in: [2025-11-26]
---

## Symptom
Rep tries to run a PPA in MI with Lansing Power & Light. Aurora lets them build the design; Enerflo errors at financing. Rep question: "does that power company not allow PPA?"

## Likely Cause
- Lansing Power & Light is not on Palmetto's active-utilities list for PPA. Per DKD 2025-11-26 (linking Palmetto's active-utilities help article): the utility is not approved.
- Enerflo's financing green/yellow/orange indicator was supposed to auto-filter to approved options only, but this one slipped through. Per DKD 2025-11-26: "that's why this one is odd. I'm sending it over to Enerflo to make sure that's marked correctly."

## Resolution
1. Confirm the customer's utility from the UB.
2. Cross-check against Palmetto's active-utilities list (help.palmetto.finance/en/articles/8500574-active-utilities) before committing the rep to a PPA pitch.
3. If the utility is not approved, pivot to cash/loan/LightReach.
4. File an Enerflo ticket if the financing indicator shows the option as available when Palmetto says otherwise — the green indicator is supposed to gate this.
5. Escalate. <!-- TODO: Sam to confirm Palmetto AVL owner -->

## Related
- `brain/utility-data/lightreach-approved-utility-mismatch.md`
- `brain/financing/goodleap-tpo-ca-failures.md`
