---
title: TPO panel selection varies by state and financing partner AVL
systems: [Enerflo, Aurora, GoodLeap, LightReach, Palmetto]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [tpo, avl, modules-by-market, lightreach, goodleap, dom-content]
seen_in: [2025-11-21, 2025-12-19, 2026-01-06, 2026-01-07, 2026-01-26, 2026-01-27]
---

## Symptom
Rep picks a panel that works for a cash/loan deal in one state and gets "panel not available in this market" or similar when trying to run TPO. Recurring examples: VA with JA 440 (failed for LightReach), FL with certain panels, CA Q.CELL 405 vs 410 ambiguity.

## Likely Cause
- The approved-panel list is a 3-way intersection: Enerflo catalog × state modules-by-market × financing partner's AVL (LightReach, GoodLeap, Palmetto). Any one of the three can block.
- LightReach requires DC-optimized panels (e.g. Q.CELL) per PID 2026-01-26: "with LR you need to use DC panels. So qcell".
- GoodLeap domestic-content AVL excludes certain inverters (IQ8X not on domestic AVL per CCE 2026-01-07) and certain panels (e.g. REC 450 was not on GoodLeap dom AVL early-Jan 2026).
- Supply chain / Jerry and team have been making changes to the equipment catalog and the "Modules by Market" sheet lags.

## Resolution
1. Always start from the current "Modules by Market" sheet (Jerry / Supply Chain owns it). Reference link commonly shared: `blueravensolar.sharepoint.com/.../SupplyChainProductDashboard/.../Doc2.aspx` (the specific URL has a long token; pull a fresh link from the sales-support channel).
2. Once you know the state's default panel, cross-check the financing partner's AVL:
   - LightReach → DC panels, typically Q.CELL 410/430.
   - GoodLeap → check their domestic content AVL if claiming DOM content; IQ8X not approved as of 2026-01-07.
   - Palmetto / cash / loan → broader but still market-gated.
3. If the rep insists a panel works in one state, do not assume it works in another.
4. Escalate to Jerry / supply chain if the rep reports a panel that SHOULD work per the sheet but Enerflo rejects.
5. Escalate. <!-- TODO: Sam to put the canonical Modules-by-Market link here once confirmed -->

## Related
- `brain/panels-equipment/goodleap-430-panel-errors-multi-market.md`
- `brain/panels-equipment/mn-seg440-panel-required.md`
- `brain/panels-equipment/qtron-430-duplicate-in-aurora.md`
- `brain/panels-equipment/qcell-405-vs-410-ca.md`
