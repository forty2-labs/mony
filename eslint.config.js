import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Import hygiene — sort & group imports/exports, drop dead imports.
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side-effect imports (e.g. `import './styles.css'`).
            ['^\\u0000'],
            // Node.js builtins.
            ['^node:'],
            // React first, then other third-party packages.
            ['^react', '^@?\\w'],
            // Internal absolute imports via the `@/` alias.
            ['^@/'],
            // Relative imports from the same/parent feature.
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      // Let unused-imports own unused-var reporting (supersedes the TS rule).
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Keep ESLint out of Prettier's way — disables all formatting-related rules.
  prettier,
);
