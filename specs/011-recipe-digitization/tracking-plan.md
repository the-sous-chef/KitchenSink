# Analytics Tracking Plan: Recipe Digitization & Family Circles

> Created: 2026-05-10
> Feature: `011-recipe-digitization`
> SDK: **None detected in monorepo** (vendor-agnostic snippets provided)
> Layer: **Both** (frontend + backend events)

## Analytics Stack Detection

Detection scan results:

- Root/workspace `package.json` files: no Mixpanel/Amplitude/Segment/PostHog/Firebase analytics dependencies found.
- Source scan under `packages/`: no existing analytics event calls (`track`, `capture`, `logEvent`, `gtag`, etc.) found.

Decision for this plan: use a vendor-agnostic tracking interface now, then wire to SDK adapter during implementation.

## Event Naming Convention

`object_action` (snake_case)

- Past tense for completed outcomes: `*_completed`, `*_saved`, `*_accepted`
- Present/transition for in-progress states: `*_started`, `*_viewed`
- Reliability monitoring states: `*_error_shown`, `*_abandoned`, `*_failed`

## Success Criteria Mapping Reference

From `spec.md` Success Metrics:

- **SC-001**: OCR parse quality ≥ 70% of submissions
- **SC-002**: Median import-to-save time < 3 min
- **SC-003**: Circle invite acceptance rate (48 h) > 60%

Derived aliases used for complete story coverage (from same Success Metrics section):

- **SC-004 (derived)**: Recipes digitized per active Sage / month ≥ 5
- **SC-005 (derived)**: Circle-shared recipes with ≥ 2 non-owner views ≥ 50%

## Events Taxonomy

### Digitization flow (upload → OCR → review → save)

| Event                                         | Trigger                                    | Story           | Success Criterion | Funnel                      | Canary-monitoring |
| --------------------------------------------- | ------------------------------------------ | --------------- | ----------------- | --------------------------- | ----------------- |
| `recipe_digitization_viewed`                  | User opens digitization entry screen       | US-001          | SC-002            | Digitization Conversion     | No                |
| `recipe_digitization_upload_started`          | User confirms image and upload begins      | US-001          | SC-002            | Digitization Conversion     | No                |
| `recipe_digitization_upload_completed`        | Image upload to S3 succeeds                | US-001          | SC-002            | Digitization Conversion     | No                |
| `recipe_digitization_ocr_requested`           | Job queued for OCR processing              | US-001          | SC-001            | Digitization Conversion     | Yes               |
| `recipe_digitization_ocr_completed`           | OCR/parsing returns structured fields      | US-001          | SC-001            | Digitization Conversion     | Yes               |
| `recipe_digitization_review_viewed`           | Side-by-side correction UI is shown        | US-002          | SC-002            | Digitization Conversion     | No                |
| `recipe_digitization_correction_field_edited` | User edits any parsed field                | US-002          | SC-001            | Digitization Conversion     | No                |
| `recipe_digitization_saved`                   | Corrected recipe is saved                  | US-002          | SC-002, SC-004    | Digitization Conversion     | Yes               |
| `recipe_digitization_retry_clicked`           | User retries after OCR/upload failure      | US-001          | SC-001, SC-002    | Digitization Error Recovery | Yes               |
| `recipe_digitization_error_shown`             | Any upload/OCR/review blocking error shown | US-001 / US-002 | SC-001, SC-002    | Digitization Error Recovery | **Yes**           |
| `recipe_digitization_abandoned`               | User exits before save completion          | US-001 / US-002 | SC-002, SC-004    | Digitization Error Recovery | **Yes**           |

### Circles flow (create → invite → accept → share)

| Event                            | Trigger                                            | Story                    | Success Criterion | Funnel                 | Canary-monitoring |
| -------------------------------- | -------------------------------------------------- | ------------------------ | ----------------- | ---------------------- | ----------------- |
| `circle_create_started`          | User opens create-circle flow                      | US-003                   | SC-003            | Circle Activation      | No                |
| `circle_created`                 | Circle is successfully created                     | US-003                   | SC-003            | Circle Activation      | Yes               |
| `circle_invite_link_generated`   | Invite link is created/rotated                     | US-003                   | SC-003            | Circle Activation      | Yes               |
| `circle_invite_link_shared`      | User triggers share action                         | US-003                   | SC-003            | Circle Activation      | No                |
| `circle_invite_opened`           | Invite recipient opens invite deep link/page       | US-004                   | SC-003            | Circle Activation      | No                |
| `circle_invite_accepted`         | Invite recipient successfully joins                | US-004                   | SC-003            | Circle Activation      | **Yes**           |
| `circle_invite_accept_failed`    | Invite accept fails (invalid/revoked/expired/auth) | US-004                   | SC-003            | Circle Invite Recovery | **Yes**           |
| `recipe_share_to_circle_started` | Owner opens audience picker + selects circle scope | US-005                   | SC-005            | Circle Activation      | No                |
| `recipe_shared_to_circle`        | Recipe audience saved with circle ref              | US-005                   | SC-005            | Circle Activation      | **Yes**           |
| `circle_recipe_viewed`           | Member opens a circle-shared recipe                | US-006                   | SC-005            | Circle Engagement      | Yes               |
| `circle_member_edit_blocked`     | Member edit attempt is denied (403)                | US-006                   | SC-005            | Circle Engagement      | **Yes**           |
| `circle_flow_abandoned`          | Owner/recipient drops out before completion        | US-003 / US-004 / US-005 | SC-003, SC-005    | Circle Invite Recovery | **Yes**           |

## Property Schemas

### 1) `actor_context`

| Property                    | Type    | Required | Description                                | Example     |
| --------------------------- | ------- | -------- | ------------------------------------------ | ----------- |
| `user_id`                   | string  | ✅       | Authenticated actor ID                     | `usr_123`   |
| `session_id`                | string  | ✅       | Session identifier                         | `ses_abc`   |
| `platform`                  | enum    | ✅       | `web` \| `ios` \| `android` \| `api`       | `web`       |
| `feature_flag_digitization` | boolean | ✅       | `digitization.enabled` state               | `true`      |
| `feature_flag_circles`      | boolean | ✅       | `circles.enabled` state                    | `true`      |
| `release_ring`              | enum    | ✅       | `canary_1`, `canary_10`, `canary_50`, `ga` | `canary_10` |

### 2) `digitization_context`

| Property           | Type   | Required | Description               | Example                              |
| ------------------ | ------ | -------- | ------------------------- | ------------------------------------ |
| `job_id`           | string | ✅       | Digitization job ID       | `job_456`                            |
| `batch_id`         | string | ❌       | Optional bulk queue ID    | `batch_22`                           |
| `source`           | enum   | ✅       | Entry source              | `camera`, `file_picker`, `deep_link` |
| `image_format`     | enum   | ✅       | `jpeg` \| `png` \| `heic` | `jpeg`                               |
| `image_size_bytes` | number | ✅       | Uploaded file size        | `2459011`                            |
| `language_code`    | string | ❌       | OCR language hint/result  | `en`                                 |

### 3) `ocr_outcome`

| Property                     | Type    | Required | Description                       | Example    |
| ---------------------------- | ------- | -------- | --------------------------------- | ---------- |
| `ocr_provider`               | string  | ✅       | Active OCR provider               | `textract` |
| `ocr_latency_ms`             | number  | ✅       | OCR processing latency            | `4230`     |
| `parse_quality_score`        | number  | ✅       | 0..1 quality score                | `0.78`     |
| `title_detected`             | boolean | ✅       | Title extracted                   | `true`     |
| `ingredient_count`           | number  | ✅       | Parsed ingredients                | `8`        |
| `step_count`                 | number  | ✅       | Parsed steps                      | `6`        |
| `low_confidence_token_count` | number  | ✅       | Tokens below confidence threshold | `2`        |

### 4) `review_save_outcome`

| Property              | Type    | Required | Description                    | Example  |
| --------------------- | ------- | -------- | ------------------------------ | -------- |
| `fields_edited_count` | number  | ✅       | Number of corrected fields     | `3`      |
| `time_to_save_ms`     | number  | ✅       | Time from first view to save   | `96420`  |
| `used_accept_all`     | boolean | ✅       | Whether accept-all action used | `false`  |
| `audience_scope`      | enum    | ✅       | `private` \| `circle`          | `circle` |
| `circle_ids_count`    | number  | ❌       | Number of circles selected     | `2`      |

### 5) `circle_context`

| Property                  | Type   | Required | Description                                      | Example       |
| ------------------------- | ------ | -------- | ------------------------------------------------ | ------------- |
| `circle_id`               | string | ✅       | Circle identifier                                | `cir_987`     |
| `invite_token_id`         | string | ❌       | Invite token identifier (non-secret ID)          | `inv_445`     |
| `invite_delivery_channel` | enum   | ❌       | `copy_link` \| `email` \| `sms` \| `share_sheet` | `share_sheet` |
| `accept_latency_ms`       | number | ❌       | Open→accept time                                 | `42000`       |
| `member_role`             | enum   | ❌       | `owner` \| `member`                              | `member`      |

### 6) `error_abandonment`

| Property         | Type   | Required | Description                                          | Example                    |
| ---------------- | ------ | -------- | ---------------------------------------------------- | -------------------------- |
| `error_code`     | string | ✅       | Stable machine-readable error                        | `digitization.ocr.timeout` |
| `error_message`  | string | ✅       | User-visible message key/text                        | `"OCR timed out"`          |
| `error_stage`    | enum   | ✅       | `upload` \| `ocr` \| `review` \| `invite` \| `share` | `ocr`                      |
| `http_status`    | number | ❌       | If applicable                                        | `503`                      |
| `last_step`      | string | ✅       | Last flow step before exit                           | `review_view`              |
| `time_spent_ms`  | number | ✅       | Time before abandonment                              | `121000`                   |
| `abandon_reason` | enum   | ❌       | `back`, `app_background`, `timeout`, `unknown`       | `app_background`           |

## Event → Property Schema Bindings

| Event                                         | Required Schemas                                               |
| --------------------------------------------- | -------------------------------------------------------------- |
| `recipe_digitization_viewed`                  | `actor_context`, `digitization_context`                        |
| `recipe_digitization_upload_started`          | `actor_context`, `digitization_context`                        |
| `recipe_digitization_upload_completed`        | `actor_context`, `digitization_context`                        |
| `recipe_digitization_ocr_requested`           | `actor_context`, `digitization_context`                        |
| `recipe_digitization_ocr_completed`           | `actor_context`, `digitization_context`, `ocr_outcome`         |
| `recipe_digitization_review_viewed`           | `actor_context`, `digitization_context`, `ocr_outcome`         |
| `recipe_digitization_correction_field_edited` | `actor_context`, `digitization_context`                        |
| `recipe_digitization_saved`                   | `actor_context`, `digitization_context`, `review_save_outcome` |
| `recipe_digitization_retry_clicked`           | `actor_context`, `digitization_context`, `error_abandonment`   |
| `recipe_digitization_error_shown`             | `actor_context`, `digitization_context`, `error_abandonment`   |
| `recipe_digitization_abandoned`               | `actor_context`, `digitization_context`, `error_abandonment`   |
| `circle_create_started`                       | `actor_context`, `circle_context`                              |
| `circle_created`                              | `actor_context`, `circle_context`                              |
| `circle_invite_link_generated`                | `actor_context`, `circle_context`                              |
| `circle_invite_link_shared`                   | `actor_context`, `circle_context`                              |
| `circle_invite_opened`                        | `actor_context`, `circle_context`                              |
| `circle_invite_accepted`                      | `actor_context`, `circle_context`                              |
| `circle_invite_accept_failed`                 | `actor_context`, `circle_context`, `error_abandonment`         |
| `recipe_share_to_circle_started`              | `actor_context`, `circle_context`                              |
| `recipe_shared_to_circle`                     | `actor_context`, `circle_context`, `review_save_outcome`       |
| `circle_recipe_viewed`                        | `actor_context`, `circle_context`                              |
| `circle_member_edit_blocked`                  | `actor_context`, `circle_context`, `error_abandonment`         |
| `circle_flow_abandoned`                       | `actor_context`, `circle_context`, `error_abandonment`         |

## Funnel Definitions

### Funnel 1 — Digitization Conversion (required)

```
recipe_digitization_upload_started
  → recipe_digitization_ocr_completed
    → recipe_digitization_review_viewed
      → recipe_digitization_saved
```

- Primary KPI: SC-002 (import-to-save median), SC-001 (parse quality contribution)
- Guardrails: error rate from `recipe_digitization_error_shown`; abandonment from `recipe_digitization_abandoned`

### Funnel 2 — Circles Activation (required)

```
circle_created
  → circle_invite_link_shared
    → circle_invite_accepted
      → recipe_shared_to_circle
```

- Primary KPI: SC-003 (invite acceptance), SC-005 (shared recipe downstream engagement)

### Funnel 3 — Digitization Error Recovery (canary)

```
recipe_digitization_error_shown
  → recipe_digitization_retry_clicked
    → recipe_digitization_saved
    OR recipe_digitization_abandoned
```

- Canary monitor: rollback signal if recovery rate degrades while error volume rises

### Funnel 4 — Circle Invite Recovery (canary)

```
circle_invite_accept_failed
  → circle_invite_opened
    → circle_invite_accepted
    OR circle_flow_abandoned
```

- Canary monitor: catches invite-link regressions during 1%→10%→50% rollout

## Coverage Matrix (Must Have Stories)

| User Story                           | Key events                                                                                                                                       | Success Criteria covered |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| US-001 Photo Import                  | `recipe_digitization_viewed`, `recipe_digitization_upload_started`, `recipe_digitization_ocr_completed`, `recipe_digitization_error_shown`       | SC-001, SC-002           |
| US-002 Side-by-side Correction       | `recipe_digitization_review_viewed`, `recipe_digitization_correction_field_edited`, `recipe_digitization_saved`, `recipe_digitization_abandoned` | SC-001, SC-002, SC-004   |
| US-003 Create Circle & Invite        | `circle_create_started`, `circle_created`, `circle_invite_link_generated`, `circle_invite_link_shared`, `circle_flow_abandoned`                  | SC-003                   |
| US-004 One-tap Invitation Acceptance | `circle_invite_opened`, `circle_invite_accepted`, `circle_invite_accept_failed`                                                                  | SC-003                   |
| US-005 Share Recipe to Circles       | `recipe_share_to_circle_started`, `recipe_shared_to_circle`                                                                                      | SC-005                   |
| US-006 Member Read-only Access       | `circle_recipe_viewed`, `circle_member_edit_blocked`                                                                                             | SC-005                   |

## Vendor-Agnostic Code Snippets

```ts
type TrackProps = Record<string, string | number | boolean | null | undefined>;

interface AnalyticsClient {
    track(event: string, props: TrackProps): void;
}

export const tracking = (client: AnalyticsClient) => ({
    digitizationUploadStarted: (props: TrackProps) => client.track('recipe_digitization_upload_started', props),
    digitizationOcrCompleted: (props: TrackProps) => client.track('recipe_digitization_ocr_completed', props),
    digitizationSaved: (props: TrackProps) => client.track('recipe_digitization_saved', props),
    digitizationErrorShown: (props: TrackProps) => client.track('recipe_digitization_error_shown', props),
    digitizationAbandoned: (props: TrackProps) => client.track('recipe_digitization_abandoned', props),
    circleCreated: (props: TrackProps) => client.track('circle_created', props),
    circleInviteAccepted: (props: TrackProps) => client.track('circle_invite_accepted', props),
    recipeSharedToCircle: (props: TrackProps) => client.track('recipe_shared_to_circle', props),
    circleMemberEditBlocked: (props: TrackProps) => client.track('circle_member_edit_blocked', props),
});
```

Frontend example (upload start + save):

```ts
trackingClient.digitizationUploadStarted({
    user_id,
    session_id,
    platform: 'web',
    source: 'camera',
    image_format: 'jpeg',
    image_size_bytes,
    release_ring: 'canary_10',
    feature_flag_digitization: true,
    feature_flag_circles: true,
});

trackingClient.digitizationSaved({
    user_id,
    session_id,
    job_id,
    fields_edited_count,
    time_to_save_ms,
    used_accept_all: false,
    audience_scope: 'circle',
    circle_ids_count: 1,
    release_ring: 'canary_10',
});
```

Backend example (invite accept success/failure):

```ts
trackingClient.circleInviteAccepted({
    user_id,
    session_id,
    circle_id,
    invite_token_id,
    accept_latency_ms,
    platform: 'api',
    release_ring: 'canary_10',
});

trackingClient.track('circle_invite_accept_failed', {
    user_id,
    session_id,
    circle_id,
    invite_token_id,
    error_code: 'circle.invite.revoked',
    error_message: 'Invite link no longer valid',
    error_stage: 'invite',
    http_status: 410,
    release_ring: 'canary_10',
});
```

## Canary Monitoring Event Set

Track these with alert thresholds during pre-impl review rollout rings:

- `recipe_digitization_error_shown`
- `recipe_digitization_abandoned`
- `recipe_digitization_ocr_completed` (latency + parse quality dimensions)
- `circle_invite_accept_failed`
- `circle_flow_abandoned`
- `circle_member_edit_blocked` (unexpected spikes can indicate authorization regressions)

---

Event count: **23**

Funnel count: **4**
