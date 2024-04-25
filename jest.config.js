import Base from './jest-base.config.js'

export default {
  ...Base,

  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
      useESM: true,
    },
  },
  setupFilesAfterEnv: ['./scripts/jest.setup.js'],
}
