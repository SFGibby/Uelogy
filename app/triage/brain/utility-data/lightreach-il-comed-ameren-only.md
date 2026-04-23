---
title: LightReach in IL only supports ComEd and Ameren
systems: [Enerflo, LightReach]
category: utility-data
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [lightreach, illinois, comed, ameren, avl, tpo]
seen_in: [2026-01-05, 2026-02-13]
---

## Symptom
Rep in IL tries to run LightReach TPO for a customer on a utility other than ComEd or Ameren and gets an error at the proposal stage even though Enerflo's generic indicator showed LR as available.

## Likely Cause
- LightReach's IL active-utility list is limited to ComEd and Ameren. Per PID 2026-02-13: "LightReach only supports ComEd or Ameren" in IL.
- Enerflo's financing indicator doesn't per-utility gate LR the way it should.

## Resolution
1. Confirm the customer's utility from the UB BEFORE pitching LR TPO.
2. If the utility is not ComEd or Ameren, pivot to cash / loan (Concert, etc.) or send the deal back to marketing.
3. If the customer has ComEd or Ameren and LR still errors, verify the LR credit app is being run under the Ambia IL portal (not SunPower or Complete — they lack IL licensing).
4. Escalate. <!-- TODO: Sam to verify the current IL LR AVL as of 2026-04 -->

## Related
- `brain/utility-data/lightreach-approved-utility-mismatch.md`
- `brain/integrations/lightreach-multiple-instances-ambia-sp.md`
- `brain/policy-process/il-contractor-license-required.md`
