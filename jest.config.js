module.exports = {
  globals: {
    __DEV__: true,
  },
  setupFilesAfterEnv: [
    '<rootDir>/test/jest.setup.ts',
  ],
  // noStackTrace: true,
  // bail: true,
  // cache: false,
  // verbose: true,
  // watch: true,
  collectCoverage: false,
  coverageDirectory: '<rootDir>/test/coverage',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.vue',
    '<rootDir>/src/**/*.js',
    '<rootDir>/src/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      //  branches: 50,
      //  functions: 50,
      //  lines: 50,
      //  statements: 50
    },
  },
  testMatch: [
    '<rootDir>/(test|src)/**/__tests__/**.(spec|test).+(ts|js)',
  ],
  moduleFileExtensions: [
    'vue',
    'js',
    'json',
    'ts',
  ],
  moduleNameMapper: {
    '^vue$': '<rootDir>/node_modules/vue/dist/vue.common.js',
    '^quasar$': '<rootDir>/node_modules/quasar/dist/quasar.common.js',
    '^~/(.*)$': '<rootDir>/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '.*css$': '<rootDir>/test/utils/stub.css',
  },
  transform: {
    '.*\\.vue$': 'vue-jest',
    '.*\\.(ts|js)$': 'ts-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    // use these if NPM is being flaky
    // '.*\\.vue$': '<rootDir>/node_modules/@quasar/quasar-app-extension-testing-unit-jest/node_modules/vue-jest',
    // '.*\\.js$': '<rootDir>/node_modules/@quasar/quasar-app-extension-testing-unit-jest/node_modules/babel-jest'
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!quasar/lang|vuex-class-modules)',
  ],
  snapshotSerializers: [
    '<rootDir>/node_modules/jest-serializer-vue',
  ],

  watchPathIgnorePatterns: [
    '<rootDir>/dev',
    '<rootDir>/dist',
    '<rootDir>/node_modules',
    '<rootDir>/docker',
    '<rootDir>/build',
  ],
};
