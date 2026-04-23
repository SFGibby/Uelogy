---
title: IL deals error "rep does not have a license number for this state"
systems: [Enerflo]
category: policy-process
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [illinois, license, contractor, hic, sales-license]
seen_in: [2026-01-06, 2026-01-19, 2026-01-26]
---

## Symptom
Rep running an IL deal in Enerflo gets "rep does not have a license number for this state" when trying to run financing or generate a HIC. Often the rep can price the deal and run credit but hits the error at proposal / contract.

## Likely Cause
- Enerflo requires the contractor license number at the company level for IL — not an individual rep number. Per CKF 2026-01-19: "You only need a contractor license number not an individual number like the HIS."
- If the rep is on an Ambia-flagged deal, Enerflo expects the Ambia IL contractor number; on a SunPower-flagged deal, the SunPower one. Mismatch between the deal's installer assignment and the license registered causes the error.
- Per DKD 2026-01-19: "Illinois also has a sales license number requirement" — but per CKF the enforced one is the contractor number; sales license is tracked separately.

## Resolution
1. Verify the deal's installer assignment (Ambia vs SunPower) matches the available contractor license.
2. If the deal is Ambia flow, confirm the Ambia IL contractor number is on file — Derek may not have this handy (per DKD 2026-01-26: "i dont know what the license number is").
3. For SunPower IL deals, use the SunPower contractor license registered in Enerflo.
4. Do not confuse this with the CA HIS individual-rep license, which is a separate requirement only for CA.
5. If the license is correctly registered but error persists, escalate to PID (Philip Dangerfield) for Enerflo-side license-config fix. <!-- TODO: Sam to confirm the current Ambia IL contractor number and where it lives in Enerflo -->

## Related
- `brain/policy-process/il-shines-srec-enerflo-pending.md`
- `brain/policy-process/ca-his-number-required.md`
