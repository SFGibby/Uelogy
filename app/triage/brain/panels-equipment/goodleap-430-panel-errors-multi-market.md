---
title: 430 panels error on GoodLeap TPOs across multiple markets
systems: [Enerflo, Aurora, GoodLeap]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [qtron, 430, jinko, seg, goodleap, modules-by-market]
seen_in: [2025-11-21, 2025-11-24, 2025-11-25, 2026-01-07]
---

## Symptom
Rep builds an Aurora design using a 430 panel (Q.TRON 430, Jinko 430, or SEG 430) and Enerflo blocks the GoodLeap TPO. The error message commonly says the panel is "not an option" or not approved for the market. Hits across CA, CO, VA, IN, MN.

## Likely Cause
- Enerflo's approved-panel list for GoodLeap did not yet include all 430 SKUs on the dates the rep tried. The "Modules by Market" sheet and the Enerflo catalog can drift. Per DKD 2025-11-25: "that was just updated, any errors are ones we need to fix to match the Mods by market sheet."
- Aurora library may contain a duplicate Q.TRON 430 module not tied to Enerflo (see `qtron-430-duplicate-in-aurora.md`).
- A market-level module selection is missing: MN should use SEG 440 (per CCE 2025-12-19 / ATP 2025-11-14), so picking a 430 in MN errors.

## Resolution
1. Cross-check the panel selected against the current "Modules by Market" sheet for the deal's state.
2. If the selected panel is not the default for that market, swap to the default (e.g. MN → SEG 440, CA/others → Q.TRON 430 BLK M-G2+ specifically).
3. If the correct panel IS on the sheet but Enerflo still errors, ping DKD/CCE — the Enerflo catalog may not yet reflect the update.
4. For Q.TRON 430, ensure the Aurora design uses `Q.TRON BLK M-G2+ 430`, not a duplicate.
5. Escalate. <!-- TODO: Sam to confirm who owns the Enerflo panel catalog -->

## Related
- `brain/panels-equipment/qtron-430-duplicate-in-aurora.md`
- `brain/panels-equipment/tpo-approved-panels-by-state.md`
- `brain/panels-equipment/mn-seg440-panel-required.md`
