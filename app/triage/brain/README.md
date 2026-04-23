# Triage Brain

Long-tail knowledge for the Triage bot. Each `.md` file under a category folder is one discrete issue the bot can answer.

**Entry schema:** copy `_template.md`, fill in the frontmatter and sections, save as `<category>/<slug>.md`.

**Categories:**
- `account-access/` — login, setup emails, expired links, duplicate accounts
- `enerflo-pricing/` — pricing moves, adders, zip rejections, TPO availability
- `panels-equipment/` — panel spec updates, availability, module-by-market configs
- `integrations/` — cross-platform sync (Enzy↔Enerflo, Aurora↔Enerflo, etc.)
- `design-tools/` — Aurora, Enzy design-side issues
- `financing/` — GoodLeap, Mosaic, Sunrun, Sunnova, LightReach, Freedom Forever
- `utility-data/` — Genability, utility company data
- `policy-process/` — rules, handoffs, approvals

**Retrieval:** the bot loads every `.md` under this directory on each request (concatenated after `knowledge-base.md`). No tag filtering yet — keep entries tight.

**Dedup:** one entry per issue. Track recurrences in `seen_in:` with ISO dates.
