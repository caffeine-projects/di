const isCI = process.env.CI === 'true'

export default {
  verbose: true,
  testTimeout: 15000,
  collectCoverage: false,
  resetModules: true,
  restoreMocks: true,
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['./bin/jest.setup.js'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
        useESM: true,
      },
    ],
  },
  coverageProvider: 'v8',
  coverageDirectory: './out',
  coverageReporters: isCI ? ['json', 'text-summary'] : ['json', 'text', 'text-summary', 'lcov'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/**/*.config.ts',
    '!**/__fixtures__/**',
    '!**/__mocks__/**',
    '!**/__tests__/**',
    '!**/_fixtures/**',
    '!**/_testdata/**',
    '!**/_tests/**',
    '!**/_performance/**',
    '!**/_bench/**',
  ],
  coveragePathIgnorePatterns: [
    '/dist/',
    '/node_modules/',
    '<rootDit>/dist',
    '<rootDir>/examples',
    '<rootDir>/internal',
    '<rootDir>/test',
  ],
  modulePathIgnorePatterns: ['dist', 'coverage', 'examples/*', 'benchmarks/*', 'scripts/*', 'internal/*'],
}
