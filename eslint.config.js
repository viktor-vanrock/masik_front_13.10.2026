import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'indent': ['error', 2],
    }
  },
  {
    files: [
      'src/pages/BenchmarkCreate/ui/CreateContent/index.tsx',
      'src/pages/BenchmarksCatalogue/ui/SuiteLane.tsx',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'indent': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/i18n/index.ts',
      'src/pages/Dashboard/data/benchmarks.ts',
      'src/pages/Dashboard/data/gigametricBenchmarks.ts',
      'src/generated/**',
      'src/data/**',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/test/**',
      'src/**/*.config.{ts,tsx}',
      'src/**/migrations/**',
      'src/**/migration/**',
    ],
    rules: {
      'max-lines': ['error', {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },
  // В тестах и тестовой инфраструктуре HMR не используется,
  // поэтому правило react-refresh здесь неактуально (часто соседствуют
  // helper-функции и компоненты в одном файле, см. renderWithProviders.tsx).
  {
    files: [
      'src/test/**/*.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
