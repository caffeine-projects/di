module.exports = {
  extends: ['eslint:recommended', 'import', 'plugin:@typescript-eslint/recommended', 'eslint-plugin-tsdoc'],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: { browser: true, es2021: true, node: true },

  rules: {
    // tsdoc
    'tsdoc/syntax': 'error',

    // node
    'node/no-missing-import': ['off'],
    'node/no-unpublished-import': ['off'],

    // typescript-eslint
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-dupe-class-members': ['error'],
    '@typescript-eslint/no-empty-function': ['error', { allow: ['decoratedFunctions'] }],
    '@typescript-eslint/no-useless-constructor': ['error'],
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/ban-types': ['off'],
    '@typescript-eslint/no-namespace': ['off'],
    '@typescript-eslint/no-non-null-assertion': ['off'],

    // import
    'import/extensions': ['error', 'ignorePackages', { js: 'always', jsx: 'never', ts: 'never', tsx: 'never' }],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
      },
    ],
    'import/no-named-as-default': ['off'],
    'import/no-duplicates': ['off'],
    'import/no-mutable-exports': ['error'],
    'import/no-useless-path-segments': [
      'error',
      {
        noUselessIndex: false,
      },
    ],
    'import/no-self-import': ['error'],
    'import/export': ['error'],
    'import/no-deprecated': ['error'],
  },

  overrides: [
    {
      env: { node: true },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        'import/extensions': ['off'],
        '@typescript-eslint/no-useless-constructor': ['off'],
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/no-unused-vars': ['off'],
      },
    },
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
