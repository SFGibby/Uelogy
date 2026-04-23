---
title: Q.TRON 430 panel errors in Enerflo (duplicate module in Aurora)
systems: [Enerflo, Aurora]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [qtron, qcell, 430, panels, goodleap, tpo, aurora-sync]
seen_in: [2025-11-21, 2025-11-24]
---

## Symptom
Rep builds a design in Aurora using the Q.TRON 430 panel and Enerflo errors on proposal creation (most often on GoodLeap TPO, across multiple markets). Symptom persists even after the approved-panel fix is rolled out in Enerflo.

## Likely Cause
- There are two Q.TRON-branded 430 modules enabled in the Aurora library, and only one of them is correctly tied to Enerflo. If a rep picks the un-tied one, Enerflo cannot match the equipment.
- Per CCE 2025-11-24: "for some reason in aurora we have two Qtron panels turned on. The one you are using in your aurora design is not correctly tied to Enerflo. Try using the other one. (Q.TRON BLK M-G2+ 430)"

## Resolution
1. In the Aurora design, verify the panel selected is specifically `Q.TRON BLK M-G2+ 430` (not a similarly-named duplicate).
2. If the wrong module is selected, swap it for the correct one and re-sync the design to Enerflo.
3. If the correct module is already selected and proposal still errors, confirm this is not actually a utility/AVL issue (see `lightreach-approved-utility-mismatch.md`).
4. Escalate. <!-- TODO: Sam to confirm who owns the Aurora module library and whether the duplicate has been removed -->

## Related
- `brain/design-tools/aurora-design-not-syncing-to-enerflo.md`
- `brain/panels-equipment/tpo-approved-panels-by-state.md`
