---
title: LightReach has separate Ambia / SunPower / Complete instances — credit in wrong one breaks deal
systems: [Enerflo, LightReach]
category: integrations
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [lightreach, ambia, sunpower, complete, licensing, portal-instance]
seen_in: [2026-02-05, 2026-02-12]
---

## Symptom
Rep runs LightReach credit app but contract / NTP never reaches Enerflo. Multiple lookups in LightReach show the customer only in one specific brand's portal (e.g. SunPower instance, not the Ambia one that Enerflo expects).

## Likely Cause
- There are (at least) three LightReach portal instances in play: Ambia, SunPower, Complete Solar. Each has its own licensing / utility AVL.
- If the credit app was initiated under the wrong instance (e.g. IL deals run under SunPower LR, which doesn't have the correct IL licensing), Enerflo cannot find the app and the customer has to redo credit under the correct portal.
- Per CCE 2026-02-12: when trying to find a customer, CCE observed the deal was in the SunPower instance of LightReach, not the expected one.

## Resolution
1. Check which LightReach portal the credit app was initiated in (Ambia, SunPower, or Complete).
2. Cross-check the state's licensing — IL for example is under Ambia, not SunPower. CA can be any of the three depending on installer assignment.
3. If the credit app was run in the wrong instance, have the customer redo the credit app from the correct portal (yes, this is painful — warn them).
4. For ongoing prevention: align the Enerflo deal's installer assignment with the correct LightReach portal BEFORE running credit.
5. Escalate. <!-- TODO: Sam to document which LR instance each state maps to, and where that config lives in Enerflo -->

## Related
- `brain/integrations/lightreach-enerflo-sync-stuck.md`
- `brain/account-access/sungage-email-plus-sp-mismatch.md`
