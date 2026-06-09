import { createConfig } from '@kitchensink/eslint';

const base = createConfig('./tsconfig.json', import.meta.dirname);
export default [...base, { ignores: ['infra/**', 'tests/e2e/**', 'src/**/*.test.ts'] }];
