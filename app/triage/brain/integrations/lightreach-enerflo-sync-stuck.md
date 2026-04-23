---
title: LightReach signed docs not syncing back to Enerflo (financing stuck)
systems: [Enerflo, LightReach, Palmetto]
category: integrations
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [lightreach, sync, ntp, financing, salesforce]
seen_in: [2026-01-27, 2026-01-28, 2026-02-04, 2026-02-05, 2026-02-11, 2026-02-12]
---

## Symptom
Customer completes everything in LightReach / Palmetto portal (identity, contract signed, NTP approved), but Enerflo still shows the financing stage as needing steps — so Project Submission fails and the deal does not push to Salesforce. Repeated occurrence across multiple days.

## Likely Cause
- Enerflo ↔ LightReach API integration has been flaky. Per DKD 2026-02-04: "Enerflo let me know that it's an API issue with lightreach" — the issue has resolved and recurred multiple times.
- Manual fix per CCE 2026-02-11: clicking back to the Financing page and hitting "sync" in Enerflo forces it to re-pull status from LightReach.
- Credit app was run in the SunPower LightReach portal instead of the Ambia one (licensing mismatch), so Enerflo doesn't recognize it (per PID 2026-02-05: "the above credit application was done in the sunpower LR portal where it doesn't have the correct licensing").

## Resolution
1. In the Enerflo deal, navigate to the Financing page and click "Sync" — this fetches current LightReach state.
2. If the customer is NTP in Palmetto/LR but Enerflo doesn't show it, ask PID / CCE to manually sync or resend contract.
3. Verify which LightReach instance the credit app was run in (Ambia vs SunPower vs Complete). If wrong instance, the customer will have to redo the credit app under the correct one.
4. After sync, complete any remaining contracting steps inside Enerflo, then Project Submission.
5. Escalate. <!-- TODO: Sam to confirm who owns Enerflo-LightReach API health -->

## Related
- `brain/integrations/enerflo-sf-project-submission-stuck.md`
- `brain/account-access/sungage-email-plus-sp-mismatch.md`
- `brain/integrations/lightreach-multiple-instances-ambia-sp.md`
