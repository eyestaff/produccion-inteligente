module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.wrangler/',
    'worker/.wrangler/',
    'frontend/public/sw.js',
    'scripts/',
    '*.cjs',
    '*.js',
  ],
  env: {
    es2020: true,
    browser: true,
    serviceworker: true,
    worker: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: ['./tsconfig.json', './frontend/tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'prefer-const': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
