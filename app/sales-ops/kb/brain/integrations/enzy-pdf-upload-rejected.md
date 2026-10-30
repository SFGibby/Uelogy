---
title: Enzy rejects PDF uploads of utility bills
systems: [Enzy]
category: integrations
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill (Yan at Sunder owns Enzy) -->
tags: [enzy, pdf, upload, utility-bill, file-type]
seen_in: [2026-01-13]
---

## Symptom
Rep tries to upload a utility bill PDF to an Enzy lead and gets an error. Previously worked fine; started failing around mid-Jan 2026. Reps complain they now have to upload 3-4 screenshots instead of one PDF.

## Likely Cause
- PDF upload support appears to have been silently removed from Enzy. Per CCE 2026-01-13: "Yeah it looks like PDF is no longer supported."
- Cause of the change is unconfirmed — CCE was going to ping Yan to check if there were recent changes.

## Resolution
1. Have the rep convert the PDF to PNG or JPG before upload.
2. If the rep can't do conversion, they can upload page screenshots (worse UX but unblocks them).
3. Flag the deal internally so the support team knows the bill is in multiple files.
4. Escalate to Yan at Sunder for reinstatement of PDF support. <!-- TODO: Sam to confirm whether PDF upload has been restored -->
5. If this is a permanent change, communicate it team-wide so reps stop wasting time retrying PDFs.

## Related
- `brain/integrations/enzy-push-to-enerflo-failing.md`
