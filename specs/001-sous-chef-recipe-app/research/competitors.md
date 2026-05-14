# Competitor Analysis: Recipe Management Apps

**Branch**: `001-sous-chef-recipe-app` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [research.md](../research.md), general industry research

---

## Competitive Landscape Overview

The recipe management space spans free consumer apps, premium desktop software, and emerging AI-assisted platforms. Six primary competitors dominate the landscape.

---

## Competitor Profiles

### 1. Paprika

| Attribute           | Detail                                                           |
| ------------------- | ---------------------------------------------------------------- |
| **Platforms**       | iOS, Android, macOS, Windows (sold separately per platform)      |
| **Pricing**         | $4.99 per platform; cloud sync $0.99/mo or $9.99/yr              |
| **MAU Estimate**    | ~1 M (cross-platform, estimated)                                 |
| **Core Strengths**  | Offline-first, native apps, deep website recipe importing        |
| **Core Weaknesses** | No collaborative features; per-platform purchase model; aging UI |
| **Versioning**      | None — single recipe version                                     |
| **Sharing**         | AirDrop / email only                                             |
| **Market Gap**      | Mobile-only collaboration and social features                    |

---

### 2. Whisk

| Attribute           | Detail                                                   |
| ------------------- | -------------------------------------------------------- |
| **Platforms**       | Web, iOS, Android                                        |
| **Pricing**         | Free tier; Premium $7.99/mo or $49.99/yr (2026 pricing)  |
| **MAU Estimate**    | ~2 M                                                     |
| **Core Strengths**  | AI meal planning, personal recipe feed, social discovery |
| **Core Weaknesses** | Heavy monetization pressure; recipe quality varies       |
| **Versioning**      | None                                                     |
| **Sharing**         | Social feed + link sharing                               |
| **Market Gap**      | Version control and collaborative editing                |

---

### 3. Mealime

| Attribute           | Detail                                                      |
| ------------------- | ----------------------------------------------------------- |
| **Platforms**       | Web, iOS, Android                                           |
| **Pricing**         | Free tier; Premium $7.99/mo or $59.99/yr                    |
| **MAU Estimate**    | ~3 M                                                        |
| **Core Strengths**  | Meal planning with grocery list generation; easy onboarding |
| **Core Weaknesses** | Focuses on meal kits over personal recipe management        |
| **Versioning**      | None                                                        |
| **Sharing**         | Limited sharing                                             |
| **Market Gap**      | Personal recipe storage and versioning                      |

---

### 4. Yummly

| Attribute           | Detail                                                          |
| ------------------- | --------------------------------------------------------------- |
| **Platforms**       | Web, iOS, Android                                               |
| **Pricing**         | Free tier; Premium $7.99/mo or $59.99/yr                        |
| **MAU Estimate**    | ~4 M                                                            |
| **Core Strengths**  | Recipe discovery via semantic search; smart kitchen integration |
| **Core Weaknesses** | Owned by appliances brands (Whirlpool); heavy upsell            |
| **Versioning**      | None                                                            |
| **Sharing**         | Social sharing                                                  |
| **Market Gap**      | Personalized recipe versioning and private collections          |

---

### 5. Cookpad

| Attribute           | Detail                                                        |
| ------------------- | ------------------------------------------------------------- |
| **Platforms**       | Web, iOS, Android                                             |
| **Pricing**         | Free for users; monetizes via ads + subscription for creators |
| **MAU Estimate**    | ~70 M (global, mostly non-English-speaking markets)           |
| **Core Strengths**  | Large community; international recipes; free                  |
| **Core Weaknesses** | Community quality is uneven; no personal versioning           |
| **Versioning**      | Fork-based model (community)                                  |
| **Sharing**         | Full community sharing                                        |
| **Market Gap**      | Personal collection management and version control            |

---

### 6. Notion Recipe Templates

| Attribute           | Detail                                                        |
| ------------------- | ------------------------------------------------------------- |
| **Platforms**       | Web, iOS, Android (via Notion)                                |
| **Pricing**         | Free tier; Plus $8/mo (includes recipe use case)              |
| **MAU Estimate**    | Not isolated; Notion claims 30 M MAU                          |
| **Core Strengths**  | Extremely flexible; can build any data model                  |
| **Core Weaknesses** | No recipe-specific features; no photo handling; no versioning |
| **Versioning**      | Database page history (manual, limited)                       |
| **Sharing**         | Notion share links only                                       |
| **Market Gap**      | Purpose-built recipe management with version history          |

---

## Feature Parity Matrix

| Feature                 | Paprika | Whisk | Mealime | Yummly | Cookpad   | Notion        |
| ----------------------- | ------- | ----- | ------- | ------ | --------- | ------------- |
| Personal recipe CRUD    | Yes     | Yes   | Partial | Yes    | Yes       | Via template  |
| Version history         | No      | No    | No      | No     | Fork-only | Page history  |
| Ingredient search       | Yes     | Yes   | Yes     | Yes    | Yes       | Via template  |
| Full-text search        | Yes     | Yes   | Yes     | Yes    | Yes       | Limited       |
| Photo upload/hosting    | Yes     | Yes   | Yes     | Yes    | Yes       | No            |
| Cloud sync              | Paid    | Yes   | Yes     | Yes    | Yes       | Yes           |
| Collaborative editing   | No      | No    | No      | No     | Community | Via workspace |
| Grocery list generation | Yes     | Yes   | Yes     | Yes    | No        | Via template  |
| Offline mode            | Yes     | No    | No      | No     | No        | No            |
| Web scraping import     | Yes     | Yes   | No      | Yes    | No        | No            |
| Meal planning calendar  | Yes     | Yes   | Yes     | Yes    | No        | Via template  |
| SQS/S3-based archival   | No      | No    | No      | No     | No        | No            |

---

## Pricing Comparison (2026)

| Competitor | Free Tier | Entry Paid                | Mid Tier           | Notes                       |
| ---------- | --------- | ------------------------- | ------------------ | --------------------------- |
| Paprika    | No        | $4.99 (one-time/platform) | $9.99/yr sync      | Per-platform purchase       |
| Whisk      | Yes       | $7.99/mo                  | $49.99/yr          | AI features in premium      |
| Mealime    | Yes       | $7.99/mo                  | $59.99/yr          | Meal kit integration        |
| Yummly     | Yes       | $7.99/mo                  | $59.99/yr          | Appliance brand integration |
| Cookpad    | Yes       | Free                      | Creator sub ($TBD) | Community model             |
| Notion     | Yes       | $8/mo Plus                | $8/mo Plus         | Full workspace              |

**Market pricing midpoint**: $7–8/mo for premium features. Sous Chef target: $5/mo entry, $10/mo premium to undercut while delivering versioning + collaboration.

---

## Market Gaps Sous Chef Targets

1. **Version control void**: No consumer recipe app offers meaningful version history with rollback. Cookpad's fork model is the closest but is community-oriented, not personal.

2. **409 Conflict resolution UX**: None of the competitors handle real-time collaborative editing conflicts with HTTP 409 and merge UI. This is an enterprise-pattern that has migrated to consumer apps (Notion, Figma) but not recipe apps.

3. **Photo versioning**: None support photo versioning tied to recipe revision history.

4. **SQS-based async archival**: No competitor uses an event-driven archive queue for version snapshots. Most use synchronous save, which caps scalability.

5. **Semantic search gap**: Whisk leads with AI meal planning but none have implemented pg_trgm + tsvector GIN search for ingredient-based faceted queries at scale.

---

## Differentiation Thesis

**Thesis**: Sous Chef occupies the intersection of Paprika's offline-capable personal collection depth and Notion's collaborative workspace model, delivered as a cloud-first service with enterprise-grade search and versioning under a $5–10/mo subscription.

**Positioning**:

- vs. Paprika: Cloud sync + collaborative editing + version history
- vs. Whisk: Full version control + no AI upsell gate
- vs. Mealime/Yummly: Personal ownership vs. discovery platform
- vs. Cookpad: Personal vault vs. community feed
- vs. Notion: Purpose-built recipe domain (FTS, ingredient matching, photo processing) vs. generic database

**Primary differentiator**: Recipe version history with 3-way merge + async SQS archival + pg_trgm/tsvector search — no competitor implements all three.

---

## Sources

- App store listings, 2026-05-09
- MyMealTicket blog: "Recipe Apps Compared: Pricing Models for 2026" (2026-04-14)
- OneRuby.dev benchmark: PostgreSQL FTS at 100k–1M rows (referenced in [research.md](../research.md))
- Timescale benchmarks: pg_textsearch vs ParadeDB (2026-03-31, referenced in [research.md](../research.md))
