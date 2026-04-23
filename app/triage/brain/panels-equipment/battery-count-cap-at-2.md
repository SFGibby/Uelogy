---
title: Enerflo capped at 2 batteries per design (no 15p / 3x 5p)
systems: [Enerflo]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [batteries, 5p, 15p, battery-count, backup]
seen_in: [2025-11-18]
---

## Symptom
Rep tries to design a 15 kW backup solution as 3x 5p batteries and Enerflo errors with a message that the deal is capped at 2 batteries. Rep frustration: "we need to compete with Tesla 13 on pricing".

## Likely Cause
- This is an operational product-catalog constraint, not a system bug. Per DKD 2025-11-18: "this is an operational constraint, not a system failure. We don't sell 15ps."
- Enerflo is enforcing the current supported battery SKU list (10c, 20c, single/double 5p) and rejecting a 3-battery design.

## Resolution
1. Confirm with the rep what kWh of backup they actually need.
2. If 10 kW or 20 kW is acceptable, pivot to a 10c or 20c configuration instead of stacking 5p's.
3. Do NOT design 3x 5p in Aurora and attempt to sync — Enerflo will reject.
4. If the customer genuinely needs a 15p-class solution, this requires Steve / product approval (per 2025-11-18 thread, Steve was later said to green-light a 15p option but it had not been added at time of incident).
5. Escalate to Steve / product. <!-- TODO: Sam to confirm whether 15p was ever formally added -->

## Related
- `brain/enerflo-pricing/battery-only-deal-not-supported.md`
- `brain/enerflo-pricing/battery-pricing-backup-vs-self-consumption.md`
