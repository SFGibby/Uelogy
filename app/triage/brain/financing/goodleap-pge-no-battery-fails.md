---
title: GoodLeap PPA on PG&E fails unless a battery is attached
systems: [Enerflo, GoodLeap]
category: financing
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [goodleap, ppa, pge, california, battery-required]
seen_in: [2026-01-08]
---

## Symptom
Rep tries to run a GoodLeap PPA in CA with PG&E utility and no battery — Enerflo marks GoodLeap as unavailable. As soon as the rep adds a battery the option becomes available again.

## Likely Cause
- GoodLeap's PPA AVL for PG&E currently requires battery storage on the design. Per BJC / DKD 2026-01-08: adding a battery worked, removing it flipped the product to unavailable.
- This appears to be a GoodLeap underwriting rule, not an Enerflo bug.

## Resolution
1. If the customer wants GoodLeap PPA with PG&E, include a battery in the design from the start.
2. If the customer is battery-averse, pitch them on the self-consumption benefits or pivot to LightReach / loan instead.
3. Do NOT tell the rep the option is broken — this is expected AVL behavior.
4. Confirm the AVL rule has not changed before applying to other CA utilities (it may be PG&E-specific).
5. Escalate if the rule appears to have changed without notice. <!-- TODO: Sam to confirm GoodLeap AVL owner -->

## Related
- `brain/financing/goodleap-tpo-ca-failures.md`
- `brain/utility-data/lightreach-approved-utility-mismatch.md`
