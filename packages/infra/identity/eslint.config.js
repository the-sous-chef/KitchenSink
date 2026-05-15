import { createConfig } from '@kitchensink/eslint';

export default [
    {
        ignores: ['cdk.out/**', 'scripts/**'],
    },
    ...createConfig('./tsconfig.json', import.meta.dirname),
];
