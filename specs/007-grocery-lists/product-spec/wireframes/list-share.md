# Wireframe: Grocery List Share & Collaboration (Web)

**Branch**: `007-grocery-lists` | **Date**: 2026-05-09
**FRs**: Domain-requested collaboration pattern (no explicit FR in current `spec.md`)

---

## Context

This wireframe captures requested sharing/family-sync behavior for grocery lists. It is included for product completeness but remains warning-level until sharing is formalized in `spec.md` FRs.

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Grocery List: Week of May 11                       [Owner: Riley]        |
+--------------------------------------------------------------------------+
|  Collaborators: [Riley] [Sam] [Jordan] [+ Invite]                        |
|  Link access: [Private v]   [Copy invite link]   [Revoke all links]      |
+--------------------------------------------------------------------------+
|  +--------------------------+  +----------------------------------------+ |
|  |  SHARE SETTINGS          |  |  ACTIVITY FEED                          | |
|  |                          |  |  Sam checked off "Eggs" (2 min ago)     | |
|  |  Permission model:       |  |  Jordan marked "Olive oil" as pantry     | |
|  |  (o) Can check/edit      |  |  Riley added "Paper towels"              | |
|  |  ( ) View only           |  +----------------------------------------+ |
|  |                          |                                              |
|  |  Notifications:          |  List Preview                                 |
|  |  [x] Push               |  [ ] Bananas                    by Riley      |
|  |  [x] In-app             |  [x] Eggs                       by Sam        |
|  |                          |  [ ] Olive oil (already have)  by Jordan     |
|  +--------------------------+                                              |
+--------------------------------------------------------------------------+
|  [Save sharing settings]                  [Back to list]                  |
+--------------------------------------------------------------------------+
```

---

## Interaction Notes

- Shared-state UI should preserve actor attribution and last-change visibility.
- Any eventual implementation should define conflict semantics explicitly before release.
