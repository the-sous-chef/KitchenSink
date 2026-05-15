import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@kitchensink/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            passWithNoTests: true,
        },
    }),
);
