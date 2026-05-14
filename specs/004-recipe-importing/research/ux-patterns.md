# UX Patterns: Recipe Importing

**Branch**: `004-recipe-importing` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md), [tasks.md](../tasks.md)

---

## 1. Import Entry Patterns

### 1.1 Import-From-URL Form

Primary flow for `FR-008`.

- Single focused URL input with paste affordance.
- Pre-submit validation (URL shape, protocol guard).
- Async loading state with stage text: Fetching → Parsing → Validating → Saving.
- Success route to preview/result card with source attribution.

**Why this pattern**: minimizes friction while still exposing progress for long-running extraction.

---

### 1.2 Import-From-Paste Form

Manual fallback flow for unsupported pages and `FR-014a` legal gating edge cases.

- Large multiline paste area for title/ingredients/instructions or semi-structured text.
- Optional source URL field to retain attribution when available.
- Parser hint panel describing accepted structures (bullets, numbered steps, headings).
- Explicit warning copy for potential paid-source content policy.

**Why this pattern**: users need a deterministic fallback when scraping fails.

---

### 1.3 Import-From-Instagram Form

Specialized URL entry for `FR-009`.

- Instagram URL input with examples of supported formats.
- Unsupported-content warning state for video-only/image-only posts without recipe caption text.
- Attribution preview before save.

**Why this pattern**: communicates scope limits upfront and prevents “silent unsupported” failure.

---

## 2. Parse-and-Confirm Pattern

### 2.1 Import Preview Screen

Core confidence-building step before final persist.

- Parsed title, ingredients, instructions rendered in editable structured fields.
- Confidence badges per section (high/medium/low extraction confidence).
- Source attribution block fixed at top.
- Call to action: Save Imported Recipe / Cancel.

**FR mapping**: `FR-008`, `FR-009`, `FR-010`, `FR-011`.

---

### 2.2 Duplicate Detection Conflict Panel

Shown when canonical source URL already exists.

- Banner: “This source was already imported.”
- Existing recipe summary card with owner/public metadata.
- Primary action: Clone Existing Recipe.
- Secondary action: View Existing Recipe.
- No action to create duplicate record.

**FR mapping**: `FR-008` duplicate clause, `FR-011` clone/public semantics.

---

## 3. Error Recovery Patterns

### 3.1 Structured Import Error Screen

Use typed failures rather than generic toasts.

- Error category chips: Unsupported Format, Paywalled Source, Timeout, Parse Incomplete, Instagram Unsupported.
- Context-specific recovery actions:
    - Retry URL
    - Open Manual Paste
    - Upload File Instead
    - View Policy Explanation (`FR-014`)

### 3.2 Partial Parse Recovery

If extraction returns partial data:

- Keep extracted fields populated.
- Highlight missing required fields.
- Allow completion and save.

**Why**: salvages user effort instead of forcing restart.

---

## 4. Accessibility and State Communication Patterns

Aligned to `NFR-003` and `NFR-004`.

- Every import action control has explicit accessible name and role.
- Error/success states include icon + text label (never color alone).
- Keyboard-first interaction for tab switches and preview form fields.
- ARIA live region announces parsing and save outcomes.

---

## 5. Wireframe Coverage Mapping

| Required Screen   | Pattern Coverage                          |
| ----------------- | ----------------------------------------- |
| `import-url`      | URL entry + staged progress               |
| `import-paste`    | manual structured paste fallback          |
| `import-preview`  | parse-and-confirm review                  |
| `import-conflict` | duplicate detect + clone-first resolution |
| `import-error`    | typed errors + action-based recovery      |
