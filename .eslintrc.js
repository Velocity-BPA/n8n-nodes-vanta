/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'n8n-nodes-base'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:n8n-nodes-base/community',
    'prettier',
  ],
  env: {
    node: true,
    es2021: true,
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '*.js',
    '!.eslintrc.js',
    'gulpfile.js',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // n8n specific rules
    'n8n-nodes-base/node-param-description-boolean-without-whether': 'error',
    'n8n-nodes-base/node-param-description-wrong-for-dynamic-options': 'error',
    'n8n-nodes-base/node-param-description-wrong-for-ignore-ssl-issues': 'error',
    'n8n-nodes-base/node-param-description-wrong-for-return-all': 'error',
    'n8n-nodes-base/node-param-option-description-identical-to-name': 'error',
    'n8n-nodes-base/node-param-option-name-wrong-for-get-many': 'error',
    'n8n-nodes-base/node-param-option-name-wrong-for-upsert': 'error',

    // General rules
    'no-console': 'off',
    'no-unused-vars': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
