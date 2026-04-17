/**
 * Frontend Test Environment Setup
 * 
 * This file runs before all tests to configure:
 * - Mock Service Worker (MSW) for API mocking
 * - Testing library DOM matchers
 * - Browser APIs that jsdom doesn't support
 */

import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// ===== MOCK SERVICE WORKER (MSW) SETUP =====
// MSW intercepts HTTP requests and returns mocked responses
// This prevents tests from calling real APIs
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Create MSW server with mocked API handlers
const server = setupServer(...handlers);

/**
 * Start MSW server before all tests
 * This sets up request interception
 */
beforeAll(() => server.listen());

/**
 * Reset handler overrides after each test
 * Ensures each test starts with default handlers
 */
afterEach(() => server.resetHandlers());

/**
 * Clean up server after all tests are done
 */
afterAll(() => server.close());

// ===== BROWSER API MOCKS =====

/**
 * Mock window.matchMedia
 * Used by responsive components that check screen size
 * jsdom doesn't implement this by default
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,                    // Initial: false (not matching)
    media: query,                      // The query string
    onchange: null,                    // Event listener
    addListener: vi.fn(),              // Deprecated method
    removeListener: vi.fn(),           // Deprecated method
    addEventListener: vi.fn(),        // Modern method
    removeEventListener: vi.fn(),      // Modern method
    dispatchEvent: vi.fn(),            // Fire events
  })),
});

/**
 * Mock window.alert
 * jsdom doesn't implement window.alert, so mock it to prevent errors
 */
global.alert = vi.fn();

/**
 * Suppress expected React warnings (optional)
 * Keeps test output clean
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Don't log the ReactDOM.render deprecation warning
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
