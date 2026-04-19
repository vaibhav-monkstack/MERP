/**
 * Backend Test Environment Setup
 * 
 * This file runs before all tests to configure the test environment.
 * It sets up test database credentials, environment variables, and mocks console output.
 */

// Set environment to 'test' so the app uses test configuration
process.env.NODE_ENV = 'test';

// Database configuration for test environment
// Note: These can be overridden by system environment variables
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'manufacturing_test';

/**
 * Mock console methods to reduce noise in test output
 * 
 * Without this, console.log() calls from the application would clutter
 * the test results. Jest provides jest.fn() to mock these functions.
 */
global.console = {
  ...console,
  log: jest.fn(),      // Mock console.log()
  debug: jest.fn(),    // Mock console.debug()
  info: jest.fn(),     // Mock console.info()
  warn: jest.fn(),     // Mock console.warn() but keep errors visible
  error: jest.fn(),    // Mock console.error() to see only test errors
};
