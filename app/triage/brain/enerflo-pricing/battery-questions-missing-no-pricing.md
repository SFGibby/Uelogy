---
title: Battery pricing does not appear in Enerflo proposal (battery questions not completed)
systems: [Enerflo]
category: enerflo-pricing
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [battery, pricing, additional-requirements, proposal]
seen_in: [2026-01-07]
---

## Symptom
Rep adds a battery to the Aurora design, syncs to Enerflo, opens proposal — but the battery shows no price (or proposal shows no adders for the battery at all).

## Likely Cause
- The rep did not fill out the battery questions inside the Additional Requirements section in the Enerflo left menu. Per CCE 2026-01-07: "Does this include a battery?" defaults to No, so without manually switching to Yes the proposal omits battery pricing.
- Rep went straight from design sync to proposal generation, skipping Additional Requirements entirely.

## Resolution
1. In the Enerflo deal, click Additional Requirements in the left menu.
2. Set "Does this include a battery?" to Yes.
3. Complete the associated battery configuration questions below it (backup vs self-consumption, etc).
4. Regenerate the proposal — pricing should populate.
5. NOTE (per CCE 2026-01-07): a proposal-generation alert is being implemented that will block proposal if battery questions are missing and route the rep back to the section. If you're reading this after that ships, the error may now be self-explanatory. <!-- TODO: Sam to confirm whether the alert shipped and when -->

## Related
- `brain/enerflo-pricing/battery-pricing-backup-vs-self-consumption.md`
- `brain/enerflo-pricing/battery-only-deal-not-supported.md`
