// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@domains/*/*'],
              message:
                'Use the domain public API (e.g. @domains/<name>) instead of deep domain imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/domains/{auth,user}/{application,domain,presentation}/**/*.ts',
      'src/domains/{auth,user}/*.module.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@infra/*',
                '../infra/*',
                '../../infra/*',
                '../../../infra/*',
                '../../../../infra/*',
                '../../../../../infra/*',
              ],
              message:
                'Do not import infra directly from domains. Depend on domain ports/interfaces.',
            },
            {
              group: ['@domains/*/*'],
              message:
                'Use the domain public API (e.g. @domains/<name>) instead of deep domain imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/common/**/*.ts',
      'src/core/**/*.ts',
      'src/config/**/*.ts',
      'src/infra/**/*.ts',
      'src/domains/{audit,feature-flag,health,metrics,streaming,upload,websocket}/**/*.ts',
      'test/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'prettier/prettier': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: [
      'src/*.ts',
      'src/{common,core,config,infra,shared}/**/*.ts',
      'src/domains/{audit,feature-flag,health,metrics,streaming,upload,websocket}/**/*.ts',
      'test/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'prettier/prettier': 'off',
    },
  },
);
