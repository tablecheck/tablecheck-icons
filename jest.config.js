module.exports = {
  collectCoverage: false,
  setupFilesAfterEnv: ['./tests/setupTests.js'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': '<rootDir>/node_modules/babel-jest'
  },
  roots: ['<rootDir>/tests']
};
