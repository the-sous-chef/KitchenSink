<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned template] → 1.0.0

Modified principles: N/A (initial authoring from template placeholders)

Added sections:
  - Core Principles (7 principles derived from Armoury documentation)
  - Quality Gates
  - Governance

Removed sections: N/A (all prior content was unfilled template placeholders)

Templates updated:
  ✅ .specify/templates/plan-template.md  — Constitution Check gates updated to reference all 7 principles
  ✅ .specify/templates/spec-template.md  — Requirements section guidance aligned with type-safety and
     accessibility constraints; testing section references pyramid and accessible-selector rules
  ✅ .specify/templates/tasks-template.md — Task categories updated to include accessibility, JSDoc,
     import-convention, and tooling setup tasks

Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Confirm original project ratification date; currently set to first-authoring
    date 2026-04-06 as no prior record exists.
-->

# KitchenSink Constitution

## Core Principles

### I. Correctness and Type Safety

All code MUST be written in strict TypeScript with zero use of `any` (outside test
doubles) and no suppressed compiler errors. The shared `@armoury/typescript` base
config (`strict: true`, `isolatedModules`, `declaration`, `declarationMap`) MUST be
extended by every workspace without weakening its flags.

- Use `interface` for data shapes and public contracts; `type` for unions, aliases,
  and mapped types.
- All custom errors MUST extend `Error` and MUST expose a type guard
  (`isXxxError(e: unknown): e is XxxError`).
- Dates in interfaces MUST be ISO 8601 strings (`string`), never `Date` objects, to
  guarantee cross-platform serialization.
- Prefer constants and enums over raw string/number literals; the `Platform` enum
  pattern is the canonical model.
- Prefer pure functions that avoid side effects; isolate and explicitly document any
  function that performs I/O, mutations, or external calls.
- Unused parameters MUST be prefixed with `_`; never delete a required parameter
  solely to silence a lint warning.

**Rationale**: Strict typing is the primary defence against runtime errors in a
multi-platform monorepo that shares logic across web, mobile, and serverless
workspaces. Weak typing at one boundary leaks unsafety to every consumer.

### II. Code Readability and JSDoc Documentation

Every exported function, class, interface, type alias, and interface field MUST
carry a JSDoc block comment. Every source file MUST open with a module-level JSDoc
summary. Inline comments MUST explain non-obvious logic or business rules — never
restate obvious code.

- Non-trivial functions MUST include `@param`, `@returns`, and `@throws` tags.
- Simple, self-explanatory functions MAY use a single-line `/** … */` comment.
- Always use braces for control structures, even single-statement bodies (enforced
  by the `curly: 'all'` ESLint rule).
- Add a blank line after block statements (`if`, `for`, `try`, `switch`) and before
  `return` statements (enforced by `padding-line-between-statements`).
- Use named exports exclusively; default exports are permitted only where a
  framework mandates them (Next.js `page.tsx` / `layout.tsx`, Expo entry).

**Rationale**: Consistent documentation and readable formatting reduce onboarding
friction and prevent silent misuse of complex APIs across workspace boundaries.

### III. Code Organization and Import Conventions

Files MUST be organized by feature domain, not by generic type. Utilities MUST live
in a `utils/` directory co-located with their consumers; library wrappers in `lib/`;
server-only data access in `dal/`; `helpers/` directories are banned.

- **Imports MUST be aliased** (`@shared/*`, `@web/*`, `@armoury/<pkg>`) except in
  `e2e/`, `__fixtures__/`, and `__testing__/` directories where no alias exists.
- Import order: (1) external packages, (2) aliased internal imports.
- Aliased imports MUST use `.js` / `.jsx` extensions; relative imports use `.ts` /
  `.tsx`.
- Component folders MUST follow the canonical structure: `ComponentName.tsx`,
  `types.ts`, `styles.ts`, `index.ts` (barrel only), `__tests__/`.
- Barrel `index.ts` files MUST use named re-exports only and MUST NOT contain
  implementation code.
- React components MUST NOT use boolean flag props to switch between fundamentally
  different render trees — composition via parent is required instead.

**Rationale**: Consistent import and directory conventions make navigation
predictable across 20+ workspaces. Aliased imports decouple code from physical
paths, preventing brittle refactors.

### IV. Testing Discipline with Pyramid Enforcement

Tests MUST conform to the testing pyramid: ≥70 % unit, ≤20 % integration,
≤10 % E2E. Every test file MUST open with a block comment mapping requirement
IDs to test case descriptions (traceability plan).

- **Unit tests** (`*.test.ts` in `__tests__/`): isolated, fast, no external services.
  Run via `vitest.config.ts` extending `@armoury/vitest` base config.
- **Integration tests** (`*.integration.test.ts`): use real adapters; run via a
  separate `vitest.integration.config.ts`; MUST NOT bleed into the default `test`
  task.
- **Service E2E** (`*.e2e.test.ts`): Lambda handlers against containerised databases;
  run via `vitest.e2e.config.ts`; `fileParallelism: false`.
- **Browser E2E** (`*.spec.ts`): Playwright only; `getByRole` and `getByLabel`
  selectors MUST be used exclusively — `data-testid` is prohibited.
- `page.waitForTimeout()` is banned in Playwright tests; use `waitForURL`,
  `waitForSelector`, or `expect(locator).toBeVisible()`.
- Global registries (codec, hydration, schema) MUST be cleared in `beforeEach` to
  prevent cross-test state leakage.
- Fixture factories MUST follow the `make*` naming convention and live in
  `__fixtures__/` with a barrel `index.ts`.
- Coverage targets: business-logic layers ≥75 %; generated files, config, barrel
  files, and test helpers are excluded from measurement.

**Rationale**: The pyramid enforces fast feedback loops. Accessible selectors keep
E2E tests resilient to DOM restructuring while simultaneously verifying that the UI
is operable without a pointing device.

### V. Monorepo Architecture and Workspace Governance

Every workspace MUST be registered in the root `package.json` workspaces array and
MUST declare `@armoury/eslint`, `@armoury/prettier`, `@armoury/typescript`, and
`@armoury/vitest` as dev dependencies. All tooling packages are private, ESM-only,
configuration-only, and MUST NOT ship runtime code.

- New workspaces MUST extend `@armoury/typescript/base.json` in `tsconfig.json`,
  import `@armoury/eslint` in `eslint.config.js`, import `@armoury/prettier` in
  `prettier.config.js`, and merge `@armoury/vitest` base config in
  `vitest.config.ts`.
- Turbo task dependencies MUST be declared explicitly: `build` depends on `^build`;
  `test` / `typecheck` depend on `^build`; `test:e2e` sets `"cache": false`.
- Per-PR schema isolation is REQUIRED for all services using Aurora DSQL: PR schemas
  follow the `pr_<number>` naming pattern and MUST be torn down on PR close.
- The `public` schema MUST never be dropped by any automated script.
- CDK manages long-lived database infrastructure; service pipelines MUST NOT
  provision or destroy clusters directly.
- Peer dependencies for shared tooling MUST be satisfied at the monorepo root, not
  duplicated in individual workspaces.

**Rationale**: Centralised tooling configuration eliminates drift between workspaces.
Explicit Turbo dependencies ensure correct build ordering and prevent stale
artifact caching. Per-PR schema isolation keeps sandbox environments reproducible
and independent.

### VI. Shared Formatting and Tooling Standards

All code MUST be formatted with the shared Prettier config (`@armoury/prettier`):
4-space indentation, spaces not tabs, semicolons always, trailing commas everywhere,
single quotes, 120-character print width. ESLint MUST run with the shared
`@armoury/eslint` flat config using `typescript-eslint` recommended rules.

- The `pre-commit` hook (`husky` + `lint-staged`) MUST run ESLint auto-fix and
  Prettier on every staged file before a commit lands.
- The `commit-msg` hook MUST enforce Conventional Commits via `commitlint`.
- CI MUST run `typecheck`, `lint`, `format:check`, and `test` for every PR; all
  four MUST pass before merge.
- TypeScript test files (`**/__tests__/**/*.ts`, `**/*.test.ts`) are exempted from
  `no-explicit-any` and `no-non-null-assertion` ESLint rules to allow test doubles.
- The `generate:types` Turbo task MUST complete before any `test`, `test:integration`,
  or `test:e2e` task runs.
- Playwright browser binaries MUST be cached by version+OS key; E2E artifacts
  (reports, traces) MUST be uploaded on failure only.

**Rationale**: Uniform formatting removes style debates from code review. Enforced
commit conventions enable automated changelogs and semantic release tooling.
Deterministic CI ordering (types → test) prevents false negatives from stale
generated code.

### VII. Accessibility and User Experience Consistency

All interactive UI elements MUST be operable and identifiable through accessible
names — either visible text, `aria-label`, or `aria-labelledby`. Icon-only buttons
MUST carry an `aria-label`. Color MUST never be the sole conveyor of information;
pair every color signal with an icon or text label.

- The design system tokens (`--accent-primary`, `--accent-secondary`,
  `--accent-highlight`, semantic status colors) MUST be consumed from the shared
  token set; hard-coded color values in component styles are prohibited.
- Typography MUST follow the major-third scale; numeric/stat data MUST use the
  monospace stack (JetBrains Mono / Fira Code).
- Motion MUST be purposeful and minimal — no decorative animations during active
  data entry or match play flows.
- Component organization MUST follow domain grouping, not type grouping
  (`/armies/`, `/matches/`, not `/buttons/`, `/modals/`); cross-domain components
  live in `/shared/`.
- Platform parity is REQUIRED: the same visual language applies to web (Next.js +
  Radix + Tailwind v4) and mobile (Expo + Tamagui); platform-specific adaptations
  are permitted for interaction patterns (hover → press + haptics) but not for
  visual language.
- All AI-generated imagery MUST use original faction-agnostic archetypes; any use
  of copyrighted or trademarked game faction names, symbols, or silhouettes in
  prompts or shipped assets is prohibited.

**Rationale**: Accessible, role-queryable UI elements are a prerequisite for
Playwright's exclusive `getByRole`/`getByLabel` selector policy (Principle IV).
Consistent visual language across platforms reduces cognitive load and accelerates
feature delivery across workspaces.

## Quality Gates

Every pull request MUST satisfy all of the following before merge:

1. **Type check** — `turbo run typecheck` exits 0 across all affected workspaces.
2. **Lint** — `turbo run lint` exits 0; no suppressed ESLint disable comments added
   without an explanatory inline note.
3. **Format** — `turbo run format:check` exits 0; formatting MUST NOT be bypassed
   by excluding files from `.prettierignore` without justification.
4. **Unit tests** — `turbo run test` exits 0 for all affected workspaces.
5. **Constitution compliance** — the PR author MUST confirm in the PR description
   that each principle has been considered, or explicitly document any justified
   deviation in the Complexity Tracking table of `plan.md`.

Integration and E2E test results are informational for PRs but MUST pass on `main`
before a production deploy proceeds.

## Governance

This constitution supersedes all prior informal conventions and any workspace-local
style guides that conflict with it. Amendments require:

1. A written proposal documenting the principle being changed, the rationale, and
   the impact on existing code.
2. Approval documented in the PR description or a linked issue.
3. A migration plan for any existing code that violates the new constraint.
4. A version increment following semantic versioning:
   - **MAJOR**: removal or incompatible redefinition of an existing principle.
   - **MINOR**: new principle or materially expanded guidance added.
   - **PATCH**: clarification, wording correction, or non-semantic refinement.

All agents and reviewers MUST check this constitution before beginning any
implementation. The plan template's **Constitution Check** gate MUST be completed
before Phase 0 research and re-checked after Phase 1 design.

**Version**: 1.0.0 | **Ratified**: 2026-04-06 | **Last Amended**: 2026-04-06
