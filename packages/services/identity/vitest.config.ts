import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
        // Migration reset tests rely on @testcontainers/postgresql (Docker) — an integration tier
        // run separately, not part of the default unit run.
        exclude: ['tests/e2e/**', 'src/database/migrations/**', 'node_modules', 'dist'],
        typecheck: {
            enabled: false,
        },
    },
});
