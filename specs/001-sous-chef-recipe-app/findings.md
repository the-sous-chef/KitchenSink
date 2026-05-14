# Adversarial Findings: Feature 001 Research

### [VALID] The Daniela Baron "118× speedup" citation is real, but narrower than the spec implies

Evidence: The cited article (`danielabaron.me`, 2026-02-03) exists and reports a search improvement from roughly 283 ms to about 2.4 ms after moving from query-time `to_tsvector(...)` to a persisted `tsvector` column with a GIN index. The article is a 100k-row, single-application benchmark, so it validates the optimization pattern, not this app's end-to-end production SLA.
Impact: Keeping a persisted `search_vector` is well supported. Using this result as proof that recipe search will comfortably meet production p95 targets at larger scale is overstated.

### [VALID] The Timescale pg_textsearch benchmark is real, but it is not a vanilla PostgreSQL FTS benchmark

Evidence: The Timescale post from 2026-03-31 exists and reports weighted p50 query latency around 40.6 ms for `pg_textsearch` on 138M MS MARCO passages, plus materially higher throughput than ParadeDB in their test. That validates that Postgres-native search can be very fast, but the benchmark is for a BM25 extension on a large IR dataset, not `tsvector`/GIN recipe search with this schema.
Impact: The source is legitimate support for "Postgres search can scale," but it is weaker support for the specific `tsvector` design than the research currently suggests.

### [WEAK] "PostgreSQL FTS is viable … persistent tsvector + GIN + rank sampling reaches well under p95 ≤ 500 ms target"

Evidence: RQ-1 mixes three different evidence classes: OneRuby's general FTS blog benchmark (100k/500k/1M records), Daniela Baron's Rails/pg_search persistent-vector benchmark at 100k rows, and Timescale's `pg_textsearch` BM25 benchmark at 138M documents. These are different workloads, ranking paths, hardware profiles, and concurrency models; none benchmarks this codebase or a recipe corpus with auth filters, joins, and faceting.
Impact: Starting with PostgreSQL remains plausible, but the latency claim should be framed as a hypothesis to validate with workload-specific load testing, not as settled fact.

### [FIXED] "Aurora DSQL … cannot store flexible recipe metadata; schema must be fully columnar"

Evidence: AWS Aurora DSQL 2026 compatibility docs list support for the `json` type and PostgreSQL JSON functions/operators. DSQL does not expose `pg_extension`, does not list `jsonb`, and still has meaningful indexing/trigger limitations, but "no JSON storage" is false.
Fix Applied: research.md RQ-2 blocker table updated — JSON supported (JSONB not), ordinary views supported (materialized views not).
Impact: RDS PostgreSQL remains the right choice — blockers are still valid, now with correct precision.

### [FIXED] "Views" are not supported in Aurora DSQL

Evidence: AWS 2026 Aurora DSQL SQL docs explicitly support `CREATE VIEW`, `ALTER VIEW`, and `DROP VIEW`. What appears unsupported is materialized views, not ordinary views.
Fix Applied: research.md updated — "Views" row now reads "Materialized views" as the specific blocker.
Impact: DSQL rejection still holds, table is now precise.

### [WEAK] The Aurora DSQL blocker matrix blends hard facts with looser inferences

Evidence: AWS docs confirm no `pg_extension`, no `pg_trigger`, and a hard limit of 3,000 mutated rows per transaction. But the research table says "3,000–10,000 rows," which is less precise than the current AWS quota doc, and I did not find equally explicit AWS documentation in this pass that proves the table's exact "GIN indexes on custom types" wording.
Impact: The conclusion can still favor RDS, but the matrix should separate confirmed blockers from inferred performance risks so future readers know which claims are solid.

### [OPEN QUESTION] "This matches what the codebase actually uses" for the database layer

Evidence: There is no implemented DB package or runtime database configuration to inspect in the current repo. `packages/api` and `packages/shared` are placeholders (`.gitkeep`), and the root `package.json` references app workspaces that are not present on disk. The architecture currently exists in planning artifacts, not runnable code.
Impact: RQ-2 is planning guidance, not verification of an implemented stack. Any wording that implies the codebase already uses RDS PostgreSQL/Drizzle is premature.

### [WEAK] The dedicated-search comparison is directionally useful, but too numerically confident

Evidence: The research does acknowledge Typesense, Meilisearch, and OpenSearch, so it is not ignoring 2026 dedicated engines. However, the exact latency/RAM figures in the table appear to come from vendor/community benchmark material rather than an apples-to-apples test on this workload; for example, Typesense's public recipe benchmark is older and reports roughly 11 ms average on 2.2M recipe documents, not the exact 3 ms p50 cited here.
Fix Applied: Latency figures in RQ-4 table now labeled "Expected" and "reference benchmarks" with qualifier that they are directional.
Impact: "Start with PostgreSQL, keep Typesense as the migration target" is still a defensible strategy. The exact benchmark table is now softened to reflect sourcing limitations.

### [VALID] The research does acknowledge that Typesense/Meilisearch have materially better search UX characteristics than PostgreSQL FTS

Evidence: RQ-4 explicitly calls out built-in typo tolerance and faceting for Typesense and Meilisearch, and it names Typesense as the preferred migration target if typo tolerance becomes P1 or p95 latency misses. That is not a blind dismissal of dedicated search.
Impact: The main weakness in RQ-4 is overprecision, not omission. The strategy is sound.

---

## Summary of Fixes Applied

| Finding                           | Status   | Fix                                                              |
| --------------------------------- | -------- | ---------------------------------------------------------------- |
| Aurora DSQL "no JSON storage"     | ✅ FIXED | Updated to: JSON supported, JSONB not                            |
| Aurora DSQL "Views not supported" | ✅ FIXED | Updated to: ordinary views supported, materialized views not     |
| Latency claims as SLA             | ✅ FIXED | Added "load testing required to validate" qualifier              |
| Benchmark table overprecision     | ✅ FIXED | Removed exact p99/RAM columns; labeled as directional benchmarks |
