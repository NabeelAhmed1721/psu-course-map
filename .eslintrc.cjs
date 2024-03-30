module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:solid/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:jsx-a11y/recommended',
    'plugin:promise/recommended',
    'plugin:tailwindcss/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'solid',
    'prettier',
    'import',
    'jsx-a11y',
    'simple-import-sort',
    'listeners',
  ],
  rules: {
    'listeners/no-missing-remove-event-listener': 'error',
    'listeners/matching-remove-event-listener': 'error',
    'listeners/no-inline-function-event-listener': 'error',
    '@typescript-eslint/no-unused-vars': ['error'],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [['^solid-js$', '^@?\\w']],
      },
    ],
    'simple-import-sort/exports': 'error',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        trailingComma: 'all',
        singleQuote: true,
        semi: true,
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
      },
    },
  },
};
