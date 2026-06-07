# Product Specification: Commise - Recipe Importing

**Branch**: `004-recipe-importing`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [spec.md](../spec.md)

---

## Vision

Recipe importing should let users bring existing recipes into Commise in under a minute while preserving source attribution, preventing duplicates, and giving clear recovery paths when parsing fails.

**Tagline**: "Import fast. Attribute correctly. Recover gracefully."

**Core principles**:

- Imported-public recipes keep durable source attribution.
- Duplicate source URLs should converge to one canonical import.
- Parse quality is transparent and correctable before save.
- Policy constraints are explicit to users, not hidden backend rejections.

---

## Personas

### Primary — P5 Morgan (Discovery Seeker)

**Archetype**: Discovery Seeker
**Motivation**: New cuisines, inspiration, expanding repertoire

Morgan browses food blogs, Substack newsletters, and niche culinary sites constantly. When something looks good, the window to act is short. Morgan wants to capture a recipe from any URL in one click and trust the result is complete enough to cook from.

**Web-import goals**:

- One-click import from food blogs and culinary publications with no copy-paste.
- JSON-LD / schema.org structured-data parsing that captures ingredients and steps accurately the first time.
- Source attribution preserved so Morgan can revisit the original blog post for context and photos.
- Clear confidence indicator when a parse is partial, so Morgan knows what to fix before saving.
- Fast duplicate detection so the same blog post doesn't pile up across multiple import attempts.

**Web-import pain points**:

- Scrapers silently drop half the ingredient list on blogs that use non-standard markup.
- No signal when a site blocks scraping, leaving Morgan staring at a spinner.
- Attribution disappears after the first edit, breaking the link back to the source.

---

### Secondary — P3 Riley (Family Meal Planner)

**Archetype**: Family Meal Planner
**Motivation**: Quick, kid-friendly, weekly rotation, household scale

Riley finds recipes through social media links shared in group chats and family texts. The workflow is paste-link-and-go. Anything that adds friction kills the habit.

**Web-import goals**:

- Paste a recipe link from Instagram, TikTok, or a food site and get a usable draft in seconds.
- Import from Instagram caption text when the post contains a full recipe.
- Avoid duplicate recipes when the same link gets pasted twice across different sessions.
- Preview parsed output and fix a missed ingredient before saving, without losing the rest of the parse.
- Keep source URL visible so Riley can share the original link with family members.

**Web-import pain points**:

- Social-media recipe links often fail silently with no explanation.
- Duplicate copies of the same recipe accumulate with no merge path.
- Vague error messages ("import failed") give no hint of what to try next.

---

### Tertiary — P11 Robin (Recipe Creator / Influencer)

**Archetype**: Recipe Creator
**Motivation**: Public creator profile; food-blogger brand; audience monetization

Robin runs a food blog and imports competitor or inspiration recipes to study structure, adapt, and publish original variations. Attribution and policy clarity matter because Robin's audience expects transparency and Robin can't afford a copyright dispute.

**Web-import goals**:

- Import a competitor's published recipe URL with full attribution locked in, so the source is always visible on Robin's adapted version.
- Use structured JSON-LD import to pull clean ingredient lists from well-formed food sites without manual cleanup.
- Understand immediately when a source is paywalled or policy-blocked, rather than getting an opaque failure.
- Clone an imported public recipe into a personal variant before editing, keeping the original attribution intact on the source copy.
- Paste a recipe from a paid publication and receive a clear policy guardrail before any public visibility is set.

**Web-import pain points**:

- Most tools strip attribution silently after the first edit, creating accidental plagiarism risk.
- No distinction between "site blocked scraping" and "parse failed" makes troubleshooting guesswork.
- Paid-source paste flows don't warn about visibility restrictions until after publishing.

---

## Epics

1. **Import Ingestion**: URL, Instagram, paste/file, and optional OCR ingestion paths.
2. **Parse Confirmation + Deduplication**: Preview, confidence, duplicate detection, clone-first conflict handling.
3. **Attribution + Policy Enforcement**: Source display lock, visibility constraints, paywall/legal policy messaging.
4. **Recovery + Accessibility**: Typed error states, keyboard and accessible interactions, non-color-only state signaling.

---

## MoSCoW Story Map (FR-Traceable)

## Must Have

### US-401 — Import Recipe from Public URL

As an authenticated user, I can submit a public recipe URL and receive a parsed recipe draft so that I can import without retyping.

**FRs**: [FR-008](../spec.md#fr-008)

### US-402 — Import from Instagram Caption

As a user, I can import from supported Instagram post URLs where recipe text exists in caption so that social-discovered recipes are usable.

**FRs**: [FR-009](../spec.md#fr-009)

### US-403 — Prominent Attribution for Imported Public Recipes

As a user, I always see source URL/author/platform on imported public recipes.

**FRs**: [FR-010](../spec.md#fr-010)

### US-404 — Visibility Rules for Imported Public Recipes

As a user, imported-public recipes are public by default and cannot be privatized except through allowed clone+substantive-edit premium flow.

**FRs**: [FR-011](../spec.md#fr-011)

### US-405 — Physical Copy Import Path (Phased)

As a user, I can import from a physical copy photo/OCR path and save as private when no public attribution source exists.

**FRs**: [FR-012](../spec.md#fr-012), [FR-013](../spec.md#fr-013)

### US-406 — Reject Paywalled Source Imports

As a user, I receive a clear rejection when importing from known paywalled sources.

**FRs**: [FR-014](../spec.md#fr-014)

---

## Should Have

### US-407 — Duplicate Source URL Conflict Handling

As a user, when the same source was already imported, I am guided to the existing recipe and clone option instead of creating a duplicate.

**FRs**: [FR-008](../spec.md#fr-008), [FR-011](../spec.md#fr-011)

### US-408 — Parse-and-Confirm Editing Before Save

As a user, I can review and edit parsed fields before final save.

**FRs**: [FR-008](../spec.md#fr-008), [FR-009](../spec.md#fr-009), [FR-010](../spec.md#fr-010)

### US-409 — Actionable Error Recovery

As a user, import failures show categorized reasons and next-step actions (retry, paste, file upload, policy link).

**FRs**: [FR-008](../spec.md#fr-008), [FR-009](../spec.md#fr-009), [FR-014](../spec.md#fr-014)

---

## Could Have

### US-410 — Paid-Source Manual Paste Policy Guardrail

As a user, if I manually paste from a paid source, the system flags policy risk and blocks public visibility.

**FRs**: [FR-014a](../spec.md#fr-014a)

**Note**: This story is policy-constrained and explicitly depends on legal revalidation.

---

## Out of Scope

- Full headless-browser scraping for heavily JS-rendered sites in initial rollout.
- Automatic legal classification of all possible paid-source content.
- Bulk import of hundreds of URLs in one submission.

---

## Traceability Guardrail

Every story above maps only to existing FR IDs in `spec.md`. No net-new functional requirements were added in this Product Forge bootstrap.
