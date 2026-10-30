---
title: Rep gets "not authorized" in Enerflo when opening from Enzy lead
systems: [Enerflo, Enzy]
category: account-access
owner: Onboarding
escalate_to: <!-- TODO: Sam to fill -->
tags: [authorization, onboarding, 1099, enerflo-access, enzy]
seen_in: [2025-12-10, 2025-12-12]
---

## Symptom
Rep (especially a new / 1099 rep) clicks an Enzy lead, Enerflo populates, then shows "you don't have authorization." Some reps also never received the initial Enerflo or Enzy invite email at all.

## Likely Cause
- Rep's Enerflo user wasn't activated or permissions weren't assigned during onboarding.
- Invite email went to wrong address (old Ambia vs new SunPower) or was spam-filtered.
- Team-lead permissions didn't carry over after the +ambia email change — manager perms in Aurora specifically needed re-granting (per CKF 2026-01-22 request for Aurora manager perms for Richard, Aaron, Benji, Mitchell).

## Resolution
1. Confirm the rep's Enerflo account actually exists — search by their email. If not, onboarding needs to send a new invite.
2. If the account exists, verify their role / permissions include deal creation and the team/installer assignment.
3. Resend onboarding invites as needed (Enerflo and Enzy are separate invites).
4. For managers: if team-lead perms were lost after the +ambia migration, request a re-grant.
5. Escalate. <!-- TODO: Sam to confirm who owns Enerflo user provisioning post-migration -->

## Related
- `brain/account-access/aurora-login-wrong-email-after-ambia-switch.md`
- `brain/integrations/enzy-push-to-enerflo-failing.md`
