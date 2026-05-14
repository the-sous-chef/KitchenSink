# UX Patterns: Recipe Management

**Branch**: `001-sous-chef-recipe-app` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md)

---

## 1. Recipe CRUD

### 1.1 Master-Detail List Pattern

The primary navigation model for recipe collections uses a **master-detail split**:

- **Master (left)**: Scrollable recipe list with thumbnail, title, tags, last-modified. Search/filter bar pinned at top.
- **Detail (right)**: Full recipe view — title, description, ingredients, steps, photos, version badge.

**Mobile adaptation**: Full-screen list view with bottom navigation. Tapping a recipe opens a full-screen detail view with back navigation.

**State transitions**:

- List item click → detail view (no page reload, SPA routing)
- Edit button → inline edit or side panel edit
- New recipe → empty detail with form fields

**References**: Paprika uses this on iPad. Whisk uses card-based feed on mobile. Notion databases use master-detail for page navigation.

---

### 1.2 Optimistic Save Pattern

Recipe saves use optimistic UI to avoid blocking the user on network round-trips:

1. User edits recipe, clicks Save
2. UI immediately reflects saved state (pending indicator on version badge)
3. Background POST/PUT request fires to `/recipes/:id`
4. On success: pending indicator clears, version increments
5. On failure: rollback to pre-save state, toast notification with retry action

**Implementation notes**:

- Debounce auto-save to 2-second idle after typing stops
- Store pending changes in `localStorage` as crash recovery buffer
- Compare before/after body to avoid no-op saves

**Conflict scenario (HTTP 409)**:

- If `ETag` or `If-Match` header mismatch → 409 Conflict
- Show conflict resolution modal (see Section 2)
- Never silently overwrite

---

### 1.3 Photo Upload Progress

Photo upload follows a staged pipeline: presigned S3 URL → direct browser-to-S3 upload → Lambda processing → CloudFront serving.

**UX flow**:

1. User taps "Add photo" → file picker opens
2. Selected file shows immediately in recipe as blurred placeholder with circular progress indicator (0–100%)
3. Upload fires to S3 via presigned URL (direct, no server relay)
4. On S3 completion, placeholder transitions to "Processing..." with spinner
5. Lambda Sharp processes image (resize, optimize, WebP convert) — typically 1–3 seconds
6. Final image fades in replacing placeholder
7. Failure states: toast notification with retry; placeholder turns red with error icon

**Sizes needed**: thumbnail (200x200), card (400x300), full (1200x900), OG image (1200x630)

**Progressive enhancement**: If Lambda is slow, show last processed size while waiting for full resolution.

---

## 2. Search UX

### 2.1 Full-Text Search with Faceted Filtering

[research.md](../research.md) establishes that PostgreSQL tsvector GIN with pg_trgm covers ingredient matching and faceted filtering.

**Search bar behavior**:

- Sticky at top of recipe list
- Instant results as user types (debounced 300ms)
- Shows top 5 matches inline dropdown before Enter
- Full results replace list view on Enter or "See all"

**Faceted filters** (sidebar or expandable drawer):

- Ingredient (multi-select, autocomplete)
- Cuisine tag (single-select or multi)
- Cook time range (slider: 0–120+ min)
- Dietary flags (vegan, gluten-free, etc.)
- Source (scraped vs. manual)

**Search result highlighting**: Matching terms wrapped in `<mark>` in results list.

**Empty state**: "No recipes match '[query]'." with suggestion to broaden filters.

---

### 2.2 Search Performance

Per [research.md](../research.md), RDS PostgreSQL tsvector GIN delivers:

- 12ms p50 at 100k rows
- 65ms p50 at 1M rows

UI target: results within 500ms p95 (per NFR from [plan.md](../plan.md) if present).

**Pattern**: If query exceeds 500ms server-side, show skeleton loader in list area and cache recent queries in `localStorage` (1-hour TTL).

---

## 3. Versioning UX

### 3.1 Version History Panel

Recipe detail view includes a "History" button that opens a right-side drawer:

- Vertical timeline: version number, timestamp, author, change summary
- Each entry shows: diff icon (ingredients added/removed, steps changed), photo change count
- Click any version → preview modal showing that version's full recipe
- Actions: "Restore this version" (creates new version from historical state), "Compare" (side-by-side diff)

**No forced branching**: Unlike Git, Sous Chef uses linear version history with optional restore. No branch UI.

**3-way merge on conflict**: When restoring, if the current version has diverged, system shows merge preview (see Section 3.2).

---

### 3.2 Conflict Resolution UI (HTTP 409)

When collaborative editing produces a 409 Conflict (the server version diverged from the client's base):

1. Save button triggers PATCH with `If-Match: <current-etag>`
2. Server returns `409 Conflict` with `Current-Version: <etag>` and diff of what changed
3. UI opens **Conflict Resolution Modal**:
    - **Left panel**: "Your version" (what user tried to save)
    - **Right panel**: "Server version" (current head)
    - **Center**: Merged result (auto-resolved where possible; highlighted conflicts where not)
4. User actions per conflict: "Keep mine", "Keep theirs", "Merge manually"
5. On resolution: POST to `/recipes/:id/resolve` with merge payload + new ETag

**Reference pattern**: Notion uses similar conflict UI ("Someone else edited this..."); Figma uses colored borders to show real-time conflict zones.

**Soft-delete before overwrite**: Before applying merge, server snapshots the current head to version archive via SQS (per [research.md](../research.md) RQ-7).

---

## 4. Sharing UX

### 4.1 Recipe Share Links

**Anonymous share**: Generate unique token URL `/share/:token` for a recipe. No login required to view. Optional: password protection.

**Permission levels**:

- View only (default for anonymous)
- Comment (viewers can leave comments)
- Edit (authenticated collaborators only)

**Copy link button**: One-click copy to clipboard; toast confirmation.

**Revoke**: Owner can revoke share link at any time from recipe settings.

---

### 4.2 Collaborative Editing Indicators

Real-time collaborative editing (if implemented via WebSocket later):

- Active collaborator avatars shown in recipe header
- Cursor position/highlight in ingredient list shows who is editing which field
- "Saving..." indicator pulses while others have pending changes

**Optimistic lock**: When a user starts editing a section, field is soft-locked (shows avatar badge). If another user tries to edit the same field, they see a "User X is editing this field" tooltip.

---

## 5. Collections UX

### 5.1 Collection Management

Collections are user-created groupings of recipes (e.g., "Weeknight Dinners", "Italian", "Holiday 2025").

**Operations**:

- Create collection: name + optional description + cover photo
- Add recipe to collection: via recipe card overflow menu or collection view "Add" button
- Reorder recipes within collection via drag-and-drop
- Remove recipe from collection (does not delete recipe itself)
- Delete collection (does not delete recipes — only the grouping)

**Default collections**: "Favorites", "Recently Added", "Cooked Recently" (auto-populated, cannot be deleted).

---

### 5.2 Soft-Delete with Undo Pattern

Deleting a recipe or collection triggers soft-delete:

1. User clicks Delete → confirmation dialog
2. On confirm: item is hidden from UI immediately (optimistic)
3. Toast appears: "Deleted. Undo?" with 8-second countdown
4. Clicking Undo restores the item (API call to `POST /recipes/:id/restore`)
5. After 8 seconds, permanent deletion is queued via SQS (per [research.md](../research.md) versioning pattern)

**Visual states**:

- Soft-deleted: grayed out, struck-through title, not shown in search results
- Pending permanent deletion: after 8-second window, item is queued; actual S3/DB cleanup happens async

---

## 6. Pattern Cross-Reference

| Pattern                 | Where Used              | Source Reference                   |
| ----------------------- | ----------------------- | ---------------------------------- |
| Master-detail list      | Recipe list/detail view | Section 1.1                        |
| Optimistic save         | All recipe writes       | Section 1.2                        |
| HTTP 409 conflict modal | Collaborative edits     | Section 3.2                        |
| Photo upload progress   | Photo handling          | Section 1.3                        |
| Soft-delete undo        | Delete operations       | Section 5.2                        |
| Faceted search          | Recipe search           | Section 2.1                        |
| Presigned S3 upload     | Photo pipeline          | [research.md](../research.md) RQ-5 |
| SQS version archival    | Version snapshot        | [research.md](../research.md) RQ-7 |
| ETag/If-Match           | Optimistic locking      | Section 1.2, 3.2                   |
