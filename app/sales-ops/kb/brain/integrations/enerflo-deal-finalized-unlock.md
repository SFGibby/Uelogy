---
title: Enerflo deal finalized too early — need to unlock to add UB / change proposal
systems: [Enerflo]
category: integrations
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [finalized, unlock, ub, proposal, unfinalize]
seen_in: [2026-01-14, 2026-01-29]
---

## Symptom
Rep finalized a proposal but realized afterwards that the UB was missing, the wrong equipment was selected, or credit was run on the wrong APR tier. Rep can't edit; tries to unfinalize and refinalize but hits errors ("that one has already been finalized").

## Likely Cause
- Enerflo locks certain deal fields once the proposal is finalized + credit is run, even after an unfinalize.
- Per DKD 2026-01-29: Enerflo support can normally unlock it in less than 2 minutes if requested through the support chat.
- Duplicating the proposal does not always re-enable APR changes (per MJM 2026-01-30 concert example).

## Resolution
1. First try: in the deal, unfinalize the current proposal and open it for edits. For small changes this works.
2. If Enerflo refuses to let you refinalize after edits, open the Enerflo support chat and ask them to unlock the deal — include the deal URL.
3. For APR-change scenarios (rep ran credit at one APR and got approved at a different one), you may need to void the existing credit app and run a new one at the correct APR rather than edit.
4. Do NOT create a brand-new deal as a workaround unless absolutely necessary — you lose Enzy linkage.
5. Escalate. <!-- TODO: Sam to confirm Enerflo support chat path for rapid unlock -->

## Related
- `brain/integrations/enerflo-sf-project-submission-stuck.md`
