import tseslint from 'typescript-eslint';
import { createConfig } from '@kitchensink/eslint';

export default tseslint.config(
    ...createConfig('./tsconfig.json', import.meta.dirname),
    {
        ignores: ['.next/**', 'next-env.d.ts', '**/*.config.*', '**/*.config.ts', 'scripts/**'],
    },
    {
        files: ['tests/**/*.ts', 'tests/**/*.tsx'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.test.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
