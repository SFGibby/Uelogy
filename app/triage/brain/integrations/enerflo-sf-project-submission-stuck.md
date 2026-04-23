---
title: Enerflo project won't push to Salesforce after deal completion
systems: [Enerflo, Salesforce, Palmetto, LightReach]
category: integrations
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [salesforce, project-submission, lightreach, palmetto, ntp, site-survey]
seen_in: [2026-01-27, 2026-01-28, 2026-01-30]
---

## Symptom
Rep completes financing + contracts. Palmetto / LightReach portal shows NTP or fully signed, but Enerflo still shows the deal as needing steps, so the project does not transfer to Salesforce. Site Survey team reports they cannot find the deal in Salesforce.

## Likely Cause
- The rep ran contracting / credit through the partner portal directly (e.g. Palmetto) instead of through Enerflo, so Enerflo never registered the completion.
- Enerflo-LightReach sync was intermittently broken on 2026-01-28. Per PID 2026-01-28: "enerflo is having issues with LR today."
- The "Submit to Project" button was pressed before all required fields were populated; Enerflo returned without fully pushing.
- The deal was flagged as finalized but the UB wasn't yet uploaded, blocking SF push.

## Resolution
1. Verify the deal's status in Enerflo: which stage is showing incomplete?
2. If contracting was done outside Enerflo (portal direct), coordinate with DKD/PID to manually sync status — per DKD 2026-01-30: "I can sync it back to enerflo when it finishes."
3. Ensure the UB is uploaded before finalizing — a finalized-before-UB deal may require Enerflo support to unlock (per DKD 2026-01-29: "enerflo support can normally unlock it in less than 2 minutes if requested").
4. Sign any remaining docs in the contracting stage, then re-click Project Submission.
5. If SF still doesn't receive it, escalate to PID for a manual SF create.
6. Escalate. <!-- TODO: Sam to confirm who can manually force-push a deal to Salesforce -->

## Related
- `brain/account-access/enerflo-paykeeper-cash-blocked.md`
- `brain/integrations/enerflo-deal-finalized-unlock.md`
