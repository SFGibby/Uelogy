---
title: GoodLeap TPO fails in CA / state-restriction errors
systems: [Enerflo, Aurora, GoodLeap]
category: financing
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [goodleap, tpo, california, ppa, state-restrictions]
seen_in: [2025-11-18, 2025-12-08, 2025-12-12, 2026-01-17]
---

## Symptom
Rep tries to run GoodLeap TPO (or PPA) on a CA deal and gets either "not available due to state restrictions" in Enerflo or no pricing options at all in Aurora. Broader rep report (2025-12-12): "TPO projects don't really work in enerflo right now (goodleap never works) and lightreach almost never gives a price that is at target."

## Likely Cause
- Licensing / contractor setup mismatch between Ambia and SunPower installers in CA. Per CCE 2025-12-17: "You cant choose sunpower as the installer in IL. It has to go through the Ambia flow" — the same installer-selection gating applies in CA for TPO.
- A stale / un-refreshed Enerflo session: multiple times a simple refresh cleared the GoodLeap error (e.g. CKF 2025-11-18: "Nevermind we refreshed and its working").
- Utility-specific GoodLeap AVL restriction (e.g. PG&E sometimes requires a battery for GoodLeap PPA — see 2026-01-08 thread where removing the battery caused "unavailable").
- Panel/inverter not on GoodLeap AVL (e.g. IQ8X not on GoodLeap domestic AVL per CCE 2026-01-07).

## Resolution
1. Refresh the Enerflo tab and retry — many GoodLeap errors clear this way.
2. Confirm the installer routing is correct for the state (Ambia flow for IL and some CA paths; SunPower for others).
3. Verify the panel/inverter combo is on GoodLeap's AVL — if uncertain, swap to a known-good combo (e.g. Q.TRON 430 + IQ8M).
4. If the utility requires a battery for GoodLeap TPO/PPA (e.g. some PG&E configs), add a battery before running.
5. If error persists, pivot to LightReach or loan/cash as a backstop so the appointment doesn't die.
6. Escalate. <!-- TODO: Sam to confirm GoodLeap CSM / AVL owner -->

## Related
- `brain/utility-data/lightreach-approved-utility-mismatch.md`
- `brain/panels-equipment/qtron-430-duplicate-in-aurora.md`
- `brain/financing/goodleap-pge-no-battery-fails.md`
