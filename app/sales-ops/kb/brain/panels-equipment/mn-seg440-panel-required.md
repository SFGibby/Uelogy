---
title: Minnesota deals require SEG 440 panels (not JA 440 / Jinko 430)
systems: [Enerflo, Aurora]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [minnesota, seg440, ja440, jinko-430, modules-by-market]
seen_in: [2025-11-14, 2025-12-19, 2026-01-07]
---

## Symptom
Rep building an MN design picks JA 440 (or Jinko 430) and Enerflo errors "panel not available in this market" when generating the proposal.

## Likely Cause
- The MN panel SKU was changed: per CCE 2025-12-19 the correct MN panel is SEG 440, not JA 440. Per ATP 2025-11-14 the change was from Jinko 430 → SEG 440. Aurora library and Enerflo catalog updates can lag.
- A separate later thread (2026-01-07) had REC 450 errors in MN which were fixed by CCE after a catalog tweak.

## Resolution
1. Confirm the deal is MN (check the address — mismatched state vs Enerflo rep location is a real cause of confusion).
2. Use SEG 440 as the default MN panel for cash / loan.
3. For TPO specifically, validate against the current "Modules by Market" sheet — GoodLeap / LightReach AVL may dictate a different SKU.
4. If the Enerflo catalog still rejects SEG 440 after the rep swaps, escalate for catalog fix.
5. Escalate. <!-- TODO: Sam to confirm the MN default panel policy as of 2026-04 -->

## Related
- `brain/panels-equipment/goodleap-430-panel-errors-multi-market.md`
- `brain/panels-equipment/tpo-approved-panels-by-state.md`
