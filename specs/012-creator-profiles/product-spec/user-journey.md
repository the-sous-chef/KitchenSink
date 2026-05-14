# User Journeys: Public Creator Profiles

**Branch**: `012-creator-profiles`
**Date**: 2026-05-13
**Status**: Bootstrapped from [product-spec.md](./product-spec.md)

---

## Journey A — Robin claims a handle and curates a profile

**Persona**: P11 Robin, aspiring food creator
**Goal**: Establish a public KitchenSink identity that can be shared outside the app.

1. Robin opts into creator mode.
2. Robin searches for and claims a unique `@handle`.
3. The system validates availability and reserves the handle.
4. Robin adds display name, bio, image, and featured recipes.
5. Robin groups recipes into named collections.
6. Robin previews the public profile and publishes it.
7. Robin copies the canonical profile URL for social sharing.

**Success evidence**: handle collision is prevented; public page is accessible without login; private recipes are excluded unless explicitly published.

---

## Journey B — Morgan discovers and follows a creator

**Persona**: P5 Morgan, discovery-driven home cook
**Goal**: Find more recipes from a trusted creator and receive future updates.

1. Morgan opens a public profile from search, share, or recipe attribution.
2. Morgan reviews the creator bio, collections, and public recipes.
3. Morgan follows the creator after finding relevant recipes.
4. New public recipes from that creator appear in Morgan's feed.
5. Morgan can unfollow without affecting saved recipes.

**Success evidence**: visitor-to-follow path is obvious; feed items trace back to the creator; follow state never grants access to private or paid content by itself.

---

## Journey C — Drew publishes an embed widget

**Persona**: P9 Drew, professional chef / brand
**Goal**: Show selected KitchenSink recipes on an external restaurant site.

1. Drew opens creator tools and selects an embed configuration.
2. Drew chooses public recipes or collections to expose.
3. The system generates copy-paste embed code.
4. Drew previews the widget before publishing externally.
5. External visitors can view the embedded public recipes and navigate back to Drew's profile.

**Success evidence**: embed setup is copy-paste; only public content appears; profile attribution is preserved.

---

## Journey D — Robin reviews creator analytics

**Persona**: P11 Robin
**Goal**: Understand whether profile and recipe publishing is growing an audience.

1. Robin opens the creator dashboard.
2. Robin views weekly profile views, follower changes, and recipe engagement.
3. Robin identifies which collections drive engagement.
4. Robin updates featured content based on the signal.

**Success evidence**: analytics are understandable without a data background; counts are privacy-safe and consistent with platform telemetry definitions.
