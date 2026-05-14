# Wireframes: Recipe Importing

**Branch**: `004-recipe-importing`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                       | Description                                                  | Key FRs                |
| ------------------------------------------ | ------------------------------------------------------------ | ---------------------- |
| [import-url.md](./import-url.md)           | URL and Instagram entry screen with staged parsing states    | FR-008, FR-009         |
| [import-paste.md](./import-paste.md)       | Manual paste fallback with structured parse guidance         | FR-008, FR-014a        |
| [import-preview.md](./import-preview.md)   | Parse-and-confirm editable preview with attribution block    | FR-008, FR-010, FR-011 |
| [import-conflict.md](./import-conflict.md) | Duplicate source conflict screen with clone-first resolution | FR-008, FR-011         |
| [import-error.md](./import-error.md)       | Typed import failure states and recovery actions             | FR-009, FR-014         |

---

## FR Reference Key

- **FR-008**: Import from public website URL with extraction and duplicate handling
- **FR-009**: Instagram import from caption-supported posts only
- **FR-010**: Prominent source attribution for web/Instagram imports
- **FR-011**: Imported public recipes visibility and clone/substantive-edit constraints
- **FR-012**: Physical copy import via photo/OCR
- **FR-013**: Physical-copy imports are private by default
- **FR-014**: Reject known paywalled source imports with clear message
- **FR-014a**: Legal-review-required policy for manually copied paid-source recipes
- **NFR-003**: Accessible names/queryable controls
- **NFR-004**: Non-color-only status communication
