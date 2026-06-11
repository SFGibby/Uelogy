---
name: edit-gating
description: Use whenever wiring up edit mode, the ?admin=1 toggle, "admin", permissions, who-can-edit, or any feature that changes the UI based on a URL parameter or client-side flag. Trigger on admin, edit mode, gate, permission, auth, login, protect, password.
---

# Edit gating — be honest about what ?admin=1 is

?admin=1 is a view toggle, not security. Anyone can type it into the URL. Treat it that way, and never let it be the thing standing between a visitor and your data.

## The rule
- A URL param (or any client-side flag) may control UI affordances only — showing edit buttons, the orange admin accent, drag handles.
- A URL param may never authorize a write to a shared backend. If ?admin=1 is the only check, every visitor is an admin.

## Decide by where edits persist
- Local-only (localStorage / this browser): ?admin=1 is fine. Worst case a visitor edits their own copy and nothing leaves their machine.
- Shared backend (writes hit an API others read): the write endpoint must enforce real auth server-side — a session, token, or login the param cannot fake. The client flag just decides whether to show the controls; the server decides whether to accept the change.

## Defaults
- Visitors are read-only. Render the board, hide all mutation controls.
- Edit affordances appear only when the admin flag is set AND (for shared data) a real credential is present.
- When in doubt, fail closed: no credential, no write.
