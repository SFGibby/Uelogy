---
title: Utility company missing from Enerflo consumption dropdown
systems: [Enerflo, Genability]
category: utility-data
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [utility, genability, consumption-profile, missing-utility]
seen_in: [2025-11-20, 2025-12-08, 2025-12-09, 2025-12-11]
---

## Symptom
Rep is on the consumption stage in Enerflo and the customer's actual utility (from their bill) is not available in the dropdown. Sometimes a wrong utility is shown in its place (e.g. rep sees "Cleveland Power" when the customer is on First Energy).

## Likely Cause
- Genability does not yet have that utility's rates loaded, so Enerflo has nothing to show in the dropdown.
- New / small / distribution-only utilities commonly aren't in Genability yet.
- Genability updates take roughly ~24 hours after a ticket is submitted (per 2025-11-20 thread).

## Resolution
1. Confirm the utility name and state from the customer's full utility bill (a full bill is required — Genability will not accept partial).
2. Submit an Enerflo ticket to get the utility added; include the customer's full UB.
3. If the customer is on the line and you cannot wait ~24 hours, the only documented workaround is: select a different utility with similar rates, enter the individual monthly usage from the UB, and create the consumption profile. The utility MUST be corrected before the project is submitted, and customer savings shown to the homeowner may be inaccurate in the meantime.
4. Do NOT apply this workaround to TPO deals — TPO selections cannot be manipulated after the fact.
5. If still blocked after ticket submission, escalate. <!-- TODO: Sam to confirm escalation owner -->

## Related
- `brain/utility-data/lightreach-approved-utility-mismatch.md`
