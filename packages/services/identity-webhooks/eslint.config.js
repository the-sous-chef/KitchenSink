import { createConfig } from '@kitchensink/eslint';

const base = createConfig('./tsconfig.json', import.meta.dirname);
// Infra files have their own tsconfig (infra/tsconfig.json) and are out of scope for the
// service's parser project. Excluding them here avoids the parserOptions.project error.
export default [...base, { ignores: ['infra/**', 'tests/e2e/**'] }];
