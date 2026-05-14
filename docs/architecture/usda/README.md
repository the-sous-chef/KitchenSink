# USDA FoodData Central — Architecture Proposals

> **Status**: Proposal
> **Date**: 2026-04-07
> **Purpose**: Decision-making — select one architecture for the recipe application's food/nutrition data layer
> **Data Source**: [USDA FoodData Central](https://fdc.nal.usda.gov/) (CC0 Public Domain, 330K+ food items)

---

## The Problem

The USDA FoodData Central API enforces a **1,000 requests/hour rate limit per IP** (rolling window). A recipe application serving even modest traffic will exceed this within minutes. There is no paid tier — higher limits require manual contact with USDA with no SLA.

These five architectures each solve this constraint differently, with distinct trade-offs in cost, complexity, latency, and operational overhead.

---

## Architecture Overview

| #   | Architecture                                                             | Core Strategy                                 | Runtime API Dependency     |
| --- | ------------------------------------------------------------------------ | --------------------------------------------- | -------------------------- |
| 1   | [Full Local Mirror](./01-full-local-mirror.md)                           | Bulk-download entire dataset into PostgreSQL  | **None**                   |
| 2   | [Smart Caching Proxy](./02-smart-caching-proxy.md)                       | Redis cache in front of USDA API, no local DB | **Full**                   |
| 3   | [Hybrid (Local DB + API Fallback)](./03-hybrid-local-db-api-fallback.md) | Foundation/SR Legacy local, Branded on-demand | **Partial** (Branded only) |
| 4   | [Edge-First Serverless](./04-edge-first-serverless.md)                   | DynamoDB + CloudFront, fully serverless       | **None**                   |
| 5   | [Event-Driven Queue-Based](./05-event-driven-queue-based.md)             | SQS async backfill, rate-limited consumers    | **Async only**             |

---

## Cost Comparison (Monthly, us-east-1)

| Architecture                   | Low Traffic | Medium Traffic | High Traffic | Notes                                                                                                                 |
| ------------------------------ | ----------- | -------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| **1. Full Local Mirror**       | ~$131/mo    | ~$153/mo       | ~$329/mo     | Fixed base cost (RDS + ElastiCache + NAT GW + Fargate)                                                                |
| **2. Smart Caching Proxy**     | ~$87/mo     | ~$117/mo       | ~$476/mo     | NAT Gateway is $32/mo fixed; Lambda@Edge expensive at scale                                                           |
| **3. Hybrid (Local DB + API)** | ~$69–85/mo  | ~$75–91/mo     | ~$108–124/mo | Lowest at medium traffic; NAT GW still needed                                                                         |
| **4. Edge-First Serverless**   | ~$2–5/mo    | ~$25–30/mo     | ~$165–175/mo | Cheapest at low traffic; **+$691/mo if OpenSearch needed**                                                            |
| **5. Event-Driven Queue**      | ~$65–75/mo  | ~$75–95/mo     | ~$95–125/mo  | Similar to Hybrid; queue infrastructure adds marginal cost. **Lean launch variant: ~$45–55/mo** (no Redis, RDS micro) |

### Cost Insights

- **Cheapest at zero/low traffic**: Architecture 4 (Edge-First) at ~$2–5/mo — true pay-per-use
- **Cheapest at medium traffic**: Architecture 3 (Hybrid) or 5 (Event-Driven) at ~$75–95/mo
- **Most predictable cost**: Architecture 1 (Full Mirror) — mostly fixed, minimal per-request variance
- **Hidden cost trap**: NAT Gateway at ~$32/mo appears in Architectures 1, 2, 3, and 5. Architecture 4 avoids it entirely.
- **Search cost trap**: Architecture 4 requires OpenSearch Serverless (~$691/mo minimum) for full-text search, making it the most expensive option if search is needed

---

## Capability Comparison

| Capability                   | 1. Full Mirror     | 2. Caching Proxy    | 3. Hybrid    | 4. Edge-First      | 5. Event-Driven    |
| ---------------------------- | ------------------ | ------------------- | ------------ | ------------------ | ------------------ |
| **Lookup latency (p95)**     | < 10ms             | 50–500ms            | 10–500ms     | < 10ms (edge)      | 10ms–30s\*         |
| **Full-text search**         | PostgreSQL pg_trgm | USDA API only       | Local + USDA | Limited (DynamoDB) | PostgreSQL pg_trgm |
| **Works when USDA is down**  | Yes                | Stale cache only    | Partially    | Yes                | Yes (queued)       |
| **Data freshness**           | Release schedule   | Real-time (on miss) | Mixed        | Release schedule   | Eventual           |
| **All 330K foods available** | Day 1              | On demand           | On demand    | Day 1              | Gradually          |
| **Global distribution**      | No (single region) | No                  | No           | Yes (CloudFront)   | No                 |
| **Operational complexity**   | Medium             | Low                 | High         | Medium             | Highest            |
| **Vendor lock-in**           | Low (PostgreSQL)   | Low                 | Low          | High (DynamoDB)    | Low                |

\*Architecture 5 returns 202 Accepted for uncached foods; data available in 10–30 seconds after async fetch. Lean launch variant (no Redis) has 20–50ms reads instead of sub-10ms.

---

## Decision Matrix

### Choose Architecture 1 (Full Local Mirror) if:

- You need **guaranteed sub-10ms latency** for all food lookups
- You expect **high query volume** (>100K/day)
- You want **zero runtime dependency** on external APIs
- You need **rich full-text search** with custom ranking
- Budget supports ~$130/mo minimum

### Choose Architecture 2 (Smart Caching Proxy) if:

- You're **prototyping or building an MVP**
- Your food catalog is **naturally limited** (users search the same ~5K foods)
- You want the **simplest possible setup** (no database to manage)
- Budget is moderate (~$87/mo base)
- You accept the **USDA API as a runtime dependency**

### Choose Architecture 3 (Hybrid) if:

- Your app **primarily uses whole/natural ingredients** (Foundation Foods)
- You want **reliability for core features** without full dataset cost
- You like the idea of the system **optimizing itself over time**
- Budget: ~$70–90/mo
- You can handle the **added routing complexity**

### Choose Architecture 4 (Edge-First Serverless) if:

- You want the **lowest possible cost at low traffic** (~$2–5/mo)
- Your app serves **users globally** (edge caching worldwide)
- You want **zero operational overhead** (no servers, no patches)
- **Full-text search is not critical** (basic filtering is enough)
- You're comfortable with **DynamoDB vendor lock-in**

### Choose Architecture 5 (Event-Driven Queue) if:

- Your app **can tolerate eventual consistency** (10–30s delay for new foods)
- You expect **bursty traffic patterns** (recipe imports, viral content)
- You want **precise control** over USDA API usage
- Your team is experienced with **event-driven AWS patterns**
- You want the system to **self-populate based on actual demand**
- **Lean launch variant** available: drop Redis, use RDS `db.t4g.micro`, cut cost floor to ~$48/mo

---

## Quick Reference: Key Numbers

| Metric                         | Value                                                  |
| ------------------------------ | ------------------------------------------------------ |
| USDA FDC rate limit            | 1,000 requests/hour per IP                             |
| Batch endpoint capacity        | 20 food IDs per request                                |
| Maximum throughput via API     | 20,000 foods/hour                                      |
| Total foods in dataset         | ~330,000                                               |
| Full dataset download          | 458 MB (zipped CSV) / 3.1 GB (unzipped)                |
| Foundation Foods               | ~1,400 items (3.4 MB zipped) — updated twice/year      |
| SR Legacy                      | ~8,790 items (6.7 MB zipped) — static (final Apr 2018) |
| Branded Foods                  | ~300,000 items (427 MB zipped) — updated monthly       |
| FNDDS (Survey)                 | ~8,700 items (200 MB zipped) — updated every 2 years   |
| PostgreSQL estimated size      | ~2 GB (full dataset with indexes)                      |
| License                        | CC0 1.0 Universal (public domain)                      |
| Time to bulk-load full dataset | ~2–5 minutes (bulk CSV) vs ~16.5 hours (API)           |

---

## Recommendation

For most recipe applications, **Architecture 3 (Hybrid)** offers the best balance:

1. Foundation Foods + SR Legacy cover 95%+ of recipe ingredients — stored locally, always fast
2. Branded Foods available on demand for barcode scanning / packaged food features
3. System learns and improves over time (promotion pipeline)
4. Moderate cost (~$75/mo) with no surprise bills
5. Core functionality works even when USDA API is down

**If budget is the primary concern** and traffic is low, start with **Architecture 4 (Edge-First)** at ~$5/mo and migrate when scale demands it.

**If latency and search quality are non-negotiable**, go with **Architecture 1 (Full Local Mirror)** — pay the ~$130/mo for complete control.

---

## Document Index

| Document                                                                   | Lines     | Description                                         |
| -------------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| [01-full-local-mirror.md](./01-full-local-mirror.md)                       | 763       | Bulk PostgreSQL ingest, zero runtime API dependency |
| [02-smart-caching-proxy.md](./02-smart-caching-proxy.md)                   | 819       | Redis cache proxy, no local database                |
| [03-hybrid-local-db-api-fallback.md](./03-hybrid-local-db-api-fallback.md) | 951       | Foundation/SR Legacy local, Branded on-demand       |
| [04-edge-first-serverless.md](./04-edge-first-serverless.md)               | 1,044     | DynamoDB + CloudFront, fully serverless             |
| [05-event-driven-queue-based.md](./05-event-driven-queue-based.md)         | 868       | SQS async backfill, rate-limited consumers          |
| **Total**                                                                  | **4,445** |                                                     |
