/**
 * Jest Configuration for Backend Testing
 * 
 * This configuration sets up Jest for testing Node.js backend code.
 * It includes:
 * - Test discovery patterns
 * - Coverage reporting
 * - Environment setup
 * - Minimum coverage thresholds
 */

module.exports = {
  // Run tests in Node.js environment (not browser)
  testEnvironment: 'node',

  // Find all test files in tests directory ending with .test.js
  // Find all test files in tests directory ending with .test.js
  roots: ['<rootDir>', '<rootDir>/../../tests/'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  testMatch: ['<rootDir>/../../tests/**/*.test.js'],

  // Output coverage reports to coverage/ directory
  coverageDirectory: 'coverage',

  // Which files to analyze for coverage (controllers, middleware, routes)
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],

  // Minimum coverage thresholds - fail if below these percentages
  coverageThreshold: {
    global: {
      branches: 70,      // All code branches must be tested
      functions: 70,     // All functions must be tested
      lines: 70,         // All lines must be tested
      statements: 70,    // All statements must be tested
    },
  },

  // Run setup file before tests to configure test environment
  setupFilesAfterEnv: ['<rootDir>/../../tests/inventory_management/backend/setup.js'],

  // Increase timeout for async operations (10 seconds)
  testTimeout: 10000,
};
