---
title: Battery-only deals cannot be priced or contracted in Enerflo
systems: [Enerflo, SolarGraf]
category: enerflo-pricing
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [battery-only, pricing, solargraf, albatross, hic]
seen_in: [2025-11-20, 2025-12-02, 2026-02-18]
---

## Symptom
Rep tries to price a battery-only project in Enerflo and gets an error (e.g. at `/customer/edit/<id>`), or tries to add a battery to an existing design and Enerflo will not allow it. Reps also report not being able to generate battery-only HICs / contracts from Enerflo.

## Likely Cause
- Enerflo does not currently support the full battery-only workflow (pricing, proposal, HIC generation). Per CCE 2025-11-20: "Battery only projects do not have the capability to be run through enerflo right now. We are working on some ways this can be done soon."
- Battery-only HIC / contract generation has at times been paused pending legal review (reported early Dec 2025).
- There is also a documented cap on number of batteries in a design — one rep hit it trying to build 3x 5p (15 kW) and got a "capped at 2 batteries" error (date: <!-- TODO: Sam to verify this is separate from the main battery-only issue -->).

## Resolution
1. For now, do NOT try to run battery-only through Enerflo.
2. Use the SolarGraf + Albatross process for battery-only sales (per CCE 2025-11-20).
3. For battery-only HICs specifically, route through the Props team — but confirm first that HIC generation is currently unpaused (legal review has blocked it in the past).
4. If the rep needs a battery-only HIC and Props says it is paused, escalate. <!-- TODO: Sam to fill current escalation path -->
5. Track status of Enerflo battery-only support; once live, migrate back.

## Related
<!-- TODO: link to battery-count-cap entry once created -->

