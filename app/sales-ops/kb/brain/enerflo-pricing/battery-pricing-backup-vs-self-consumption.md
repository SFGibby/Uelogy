---
title: 5p battery priced at ~$11k instead of ~$5,600 (backup vs self-consumption config)
systems: [Enerflo]
category: enerflo-pricing
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [5p, battery-pricing, backup, self-consumption, grid-tied]
seen_in: [2025-11-14, 2026-01-06, 2026-01-26]
---

## Symptom
Rep builds a design with a 5p battery and sees the battery line priced at roughly $11,000 instead of the ~$5,600 they expect. Usually happens on a small system (e.g. 14 panels + 5p).

## Likely Cause
- The battery is flagged as "backup" configuration in Enerflo when the rep intended "self-consumption" / "grid-tied". Backup 5p pricing is significantly higher. Per CCE 2025-11-14: switching configuration from backup to self-consumption corrected pricing.
- Per DKD 2026-01-26: 5p is NOT allowed to be a backup config and Enerflo may still mark it as backup if the wrong battery question is answered; 5p is only valid as grid-tied / self-consumption.
- A related case (2026-01-06): 5p grid-tied still showed ~$11k instead of $5,600 — was also traced to the backup flag / battery questions not being filled in correctly.

## Resolution
1. Open the deal proposal and verify battery configuration is set to self-consumption (not backup) if the customer only wants grid-tied.
2. Check the Additional Requirements section in the left menu: ensure "Does this include a battery?" is set to Yes and the battery-config question is set correctly (defaults to No and backup).
3. If the rep already finalized, unfinalize the proposal, correct the config, and refinalize.
4. Confirm pricing updates — should drop to ~$5,600 for a single 5p self-consumption.
5. If pricing is still wrong after correction, escalate. <!-- TODO: Sam to confirm escalation owner for battery pricing mismatch -->

## Related
- `brain/enerflo-pricing/battery-questions-missing-no-pricing.md`
- `brain/panels-equipment/battery-count-cap-at-2.md`
