# User Journeys: Recipe Digitization & Family Circles

**Branch**: `011-recipe-digitization`
**Date**: 2026-05-13
**Status**: Bootstrapped from [product-spec.md](./product-spec.md)

---

## Journey A — Sage digitizes a family recipe card

**Persona**: P10 Sage, Heritage Archivist
**Goal**: Preserve a fragile paper recipe as a structured private recipe without retyping it.

1. Sage opens the digitization entry point and chooses **capture recipe from photo**.
2. She photographs the front of an index card and confirms image quality.
3. The system queues OCR/normalization and shows progress without blocking the rest of the app.
4. Sage reviews the structured draft next to the original image.
5. Low-confidence ingredients, quantities, and instructions are highlighted for focused correction.
6. Sage edits only the flagged fields, previews the final recipe, and saves it to her collection.
7. The saved recipe remains private until Sage shares it with a Circle.

**Success evidence**: OCR result produced in under the product target; correction requires substantially less effort than manual entry; accepted output becomes a normal recipe entity.

---

## Journey B — Sage creates a Family Circle and invites Riley

**Personas**: P10 Sage and P3 Riley
**Goal**: Share family recipes privately without publishing them to the public corpus.

1. Sage creates a named Circle for family recipes.
2. She selects one or more digitized recipes and shares them to the Circle.
3. Sage sends Riley an invite.
4. Riley opens the invite, authenticates if required, and accepts membership.
5. Riley browses the Circle collection and opens a shared recipe.
6. Riley can use the recipe in downstream meal-planning flows only through permitted access.

**Success evidence**: invite acceptance is one-tap after authentication; Circle recipes are visible only to authorized members; ownership and edit rights remain clear.

---

## Journey C — Alex runs a bulk import queue

**Persona**: P8 Alex, Sous Chef Power User
**Goal**: Digitize many cookbook pages without babysitting each job.

1. Alex selects multiple images for bulk import.
2. The system creates a queue with per-item status.
3. Alex leaves the flow while processing continues.
4. Completed jobs are grouped for review; failed or low-confidence jobs are called out separately.
5. Alex accepts clean drafts in bulk and opens flagged drafts for focused correction.
6. The system preserves source images and job history for troubleshooting.

**Success evidence**: queue state survives navigation; bulk accept never saves low-confidence drafts without review; failed jobs are recoverable.
