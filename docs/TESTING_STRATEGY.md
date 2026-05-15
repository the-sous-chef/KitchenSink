# Testing Strategy

A comprehensive guide to testing in the monorepo — covering unit, integration, and E2E testing across all workspaces.

**Version**: 1.0.0 | **Created**: 2026-05-15

---

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Testing (Vitest)](#unit-testing-vitest)
3. [Integration Testing (Vitest)](#integration-testing-vitest)
4. [E2E Testing — Web (Playwright)](#e2e-testing--web-playwright)
5. [E2E Testing — Mobile (Maestro)](#e2e-testing--mobile-maestro)
6. [CI/CD Integration](#cicd-integration)
7. [Coverage Strategy](#coverage-strategy)
8. [Testing Conventions](#testing-conventions)

---

## Testing Pyramid

```
          ┌──────────┐
          │   E2E    │  ← Browser + device (Playwright, Maestro)
          │  ~5-10%  │    Critical user journeys only
         ─┼──────────┼─
        / Integration \  ← Real adapters, real services
       /    ~10-20%    \   Cross-module, slower, external deps
      ─┼────────────────┼─
     /       Unit        \  ← Isolated, fast, deterministic
    /        ~70-80%      \  The vast majority of tests
   └────────────────────────┘
```

**Unit tests** form the base. They run in milliseconds, need no external services, and give you fast feedback during development. Write them for every function, class, and module.

**Integration tests** verify that the boundaries between modules behave correctly — data adapters with real SQL, service handlers with real database tables. They're slower and require setup, so write them selectively.

**E2E tests** cover the things only a real browser or device can verify — auth flows, page navigation, multi-step user journeys. Keep them to the critical paths. Don't try to cover every edge case here; that's what unit tests are for.

---

## Unit Testing (Vitest)

### Configuration

Each workspace extends a shared Vitest base config. Workspaces add only workspace-specific path aliases and include/exclude patterns.

### Test File Locations

```
src/<module>/
├── <module>/
│   ├── __tests__/                   # Unit tests
│   │   ├── *.test.ts
│   │   └── __fixtures__/            # Fixtures for unit tests
│   ├── __integration__/             # Integration tests
│   │   ├── *.integration.test.ts
│   │   └── __fixtures__/
│   └── __mocks__/                   # Manual mocks
```

---

## Integration Testing (Vitest)

### When to Write Integration Tests

Write integration tests when you need to verify that a module works correctly with a real implementation of its dependencies — a real database, a real HTTP client, a real file system.

Do not write integration tests for logic that's fully covered by unit tests. Integration tests confirm the seams, not the internals.

### Setup and Teardown

Integration tests require real services. Use Docker-based setup via a shared `src/__testing__/docker-setup.ts` in each service workspace. Each service defines its own Docker Compose file for local development.

---

## E2E Testing — Web (Playwright)

Playwright covers critical browser-based user journeys through the real application.

### Test File Location

```
e2e/
├── <feature>/
│   ├── fixtures/
│   │   ├── index.ts       # Compose all fixtures here
│   │   └── *.fixture.ts   # One fixture file per feature
│   ├── pages/
│   │   └── *.po.ts       # Page Objects
│   └── tests/
│       └── *.spec.ts      # One spec per user journey
└── playwright.config.ts
```

### Fixtures

Use Playwright `test` fixtures for test data that needs to be created before each test and cleaned up after. The `page` and `request` fixtures are built in; extend with custom ones.

```typescript
// e2e/<feature>/fixtures/foo.fixture.ts
import { test as base, type Page } from '@playwright/test';

type AppFixture = {
    foo: Foo;
};

export const test = base.extend<AppFixture>({
    foo: async ({ request }, use) => {
        const response = await request.post('/api/foos', {
            data: {
                name: 'Test Foo',
                fooId: 'test-foo',
            },
        });

        const foo = await response.json();
        await use(foo);
        await request.delete(`/api/foos/${foo.id}`);
    },
});
```

### Critical User Journeys

These are the journeys to cover first, in roughly priority order:

| Journey               | Pages                              | Auth Required |
| --------------------- | ---------------------------------- | ------------- |
| Sign in / sign out    | `/auth/signin`, `/dashboard`       | No / Yes      |
| Create a new resource | `/resources/new`, `/resources/:id` | Yes           |
| Edit a resource       | `/resources/:id/edit`              | Yes           |
| View resource detail  | `/resources/:id`                   | Yes           |

Don't cover every variant here. Cover the happy path and one key error state per journey (e.g., "name required" validation on the create form). Edge cases belong in unit tests.

### Turbo Pipeline Integration

The `test:e2e` Turbo task should exist with `"cache": false`. Playwright tests can run via:

```bash
# Directly (dev mode, webServer starts automatically)
npx playwright test --config e2e/playwright.config.ts

# Interactive UI mode
npx playwright test --config e2e/playwright.config.ts --ui

# Via Turbo
npx turbo run test:e2e --filter=<workspace>
```

---

## E2E Testing — Mobile (Maestro)

Maestro covers critical user journeys through the real mobile app running in an emulator.

### Flow File Location

```
e2e/mobile/
└── flows/
    └── *.yaml          # One flow file per journey
```

### Flow Structure

Maestro flows are YAML files that describe user interactions. Keep flows under ~50 lines. Extract repeated sub-flows into reusable `subflow/` files.

```yaml
# e2e/mobile/flows/onboarding.yaml
appId: ${APP_ID}
name: Onboarding Flow

env:
    APP_ID: ${MAESTRO_APP_ID}
    USERNAME: test@example.com
    PASSWORD: TestPass123!

do:
    - clearState
    - launchApp
    - assertVisible: WelcomeScreen
    - tap: GetStartedButton
    - inputText:
          text: ${USERNAME}
          into: EmailInput
    - inputText:
          text: ${PASSWORD}
          into: PasswordInput
    - tap: SignInButton
    - assertVisible: HomeScreen
```

### Known Issues and Workarounds

| Issue                                                                    | Affected Versions            | Workaround                                                                |
| ------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------- |
| iOS Simulator hangs on launch with Xcode 16.2 on macOS Sequoia           | Maestro < 1.40.0, Xcode 16.2 | Upgrade to Maestro 1.40.0+, or downgrade Xcode to 16.1                    |
| `scrollUntilVisible` times out on wrapped scroll views                   | All Maestro versions         | Increase `timeout:` or wrap content in a plain `View` for E2E builds      |
| iOS Simulator crashes when New Architecture is enabled                   | Maestro < 1.38.0             | Upgrade Maestro, or disable New Architecture in `app.json` for E2E builds |
| Android emulator flows fail on API level < 29                            | All Maestro versions         | Target API 29+ in your CI emulator config                                 |
| `launchApp: clearState: true` does not clear Expo SecureStore on Android | All Maestro versions         | Add an explicit logout step at the start of flows                         |

---

## CI/CD Integration

### Key CI Decisions

**Parallelise across jobs, not within.** Type generation (or equivalent setup) runs once; unit, integration, and E2E fan out in parallel. The full pipeline from push to result should complete in under 10 minutes for PRs.

**Cache dependencies.** Add a cache step keyed on the package manager lockfile to avoid re-downloading `node_modules` on every run.

**Upload artifacts on failure only.** HTML reports and traces are only useful when something breaks. Uploading on every run wastes storage and slows down passing runs.

**Never cache E2E test outputs.** The Turbo task should set `"cache": false` for E2E tasks. Do not add remote caching for E2E outputs.

---

## Coverage Strategy

### What to Measure

Coverage is a tool for spotting untested code paths, not a target to game. Don't chase a percentage at the cost of writing meaningless tests.

Measure **statement and branch coverage** in the business logic layers. Exclude test files, mocks, config files, and barrel files from coverage.

### Enforcement

Configure coverage thresholds as a fail-fast gate in CI. Reject PRs that drop coverage below the project-defined threshold without a justification tracked in the project issue tracker.

---

## Testing Conventions

These rules apply across all test types. They complement the patterns in `docs/CODING_STANDARDS.md`.

### File Naming Summary

| Type        | File pattern                      | Config that picks it up        |
| ----------- | --------------------------------- | ------------------------------ |
| Unit        | `__tests__/*.test.ts`             | `vitest.config.ts`             |
| Integration | `__tests__/*.integration.test.ts` | `vitest.integration.config.ts` |
| Service E2E | `src/**/*.e2e.test.ts`            | `vitest.e2e.config.ts`         |
| Browser E2E | `e2e/web/tests/*.spec.ts`         | `playwright.config.ts`         |
| Mobile E2E  | `e2e/mobile/flows/*.yaml`         | Maestro CLI                    |

### Test Plan Comment

Every test file must open with a block that maps requirements to test cases. This enforces traceability and makes the file scannable:

```typescript
/**
 * ResourceService — unit tests
 *
 * REQ-01 getById returns null when the resource does not exist
 * REQ-02 getById returns the resource when it exists
 * REQ-03 save persists a new resource with the provided fields
 * REQ-04 save updates an existing resource without overwriting unrelated fields
 * REQ-05 delete removes the resource from the store
 * REQ-06 list returns all resources for the given owner
 * REQ-07 list returns an empty array when the owner has no resources
 */
```

### `describe` / `it` Structure

```typescript
describe('ResourceService', () => {
    describe('getById', () => {
        it('returns null when the resource does not exist', () => { ... });
        it('returns the resource when it exists', () => { ... });
    });

    describe('save', () => {
        it('persists a new resource', () => { ... });
        it('updates an existing resource', () => { ... });
    });
});
```

Use a top-level `describe` for the module or class, then nested `describe` blocks per method or feature. `it` labels describe observable behaviour from the caller's perspective, not implementation details.

### Explicit Vitest Imports

Always import test functions explicitly, even though globals are enabled:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

### What Makes a Good Test

A test is valuable when:

- It fails when behaviour breaks (regression protection)
- It documents how the module is meant to be used
- It catches a class of bugs you've seen or can reason about

A test is wasteful when:

- It only asserts that a mock was called (testing the mock, not the code)
- It duplicates another test with minor input variation that doesn't test a new branch
- It exists solely to hit a coverage number

Prefer fewer, more meaningful tests over many shallow ones.

### Playwright Conventions

- Use `getByRole` and `getByLabel` selectors exclusively. Never use `data-testid` attributes — all elements must be queryable via accessible names.
- Add accessible labels (`aria-label`, `aria-labelledby`) to elements that have no visible text (e.g., icon-only buttons) so they can be queried by role.
- Never use `page.waitForTimeout()`. Use `waitForURL`, `waitForSelector`, or `expect(locator).toBeVisible()` instead.
- Keep test files under ~100 lines. Extract repeated interactions into Page Objects or fixtures.
- One assertion-heavy test per journey. Don't split a single user flow across many `it` blocks.

### Test Data Isolation

Each test must clean up after itself. Options in priority order:

1. **Transaction rollback** — wrap the test in a DB transaction and roll back on teardown (fastest)
2. **Fixture teardown** — create via API in `setup`, delete via API in `teardown` (Playwright fixture pattern)
3. **Unique data per test** — use a random suffix so tests don't collide even if cleanup fails

Never share mutable state between tests. Tests must be runnable in any order and in parallel.

### Don't Duplicate Coverage Across Layers

If a service method is fully covered by unit tests, don't re-test the same edge cases in an integration test. Integration tests confirm the service works with a real database, not every permutation of its logic.

If a flow is covered by an E2E test, don't add a component test that simulates the same user journey at a lower level just to increase coverage numbers.

E2E tests are expensive to run and maintain. Use them to verify the seams between systems, not to re-verify business logic that's already well covered at lower layers.
