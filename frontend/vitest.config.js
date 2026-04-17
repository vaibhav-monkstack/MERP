/**
 * Vitest Configuration for Frontend Testing
 * 
 * This configuration sets up Vitest for testing React components.
 * It includes:
 * - jsdom environment (browser-like environment)
 * - Setup files for test initialization
 * - Coverage reporting
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Enable React plugin for JSX syntax
  plugins: [react()],
  
  test: {
    // Use global test functions (describe, it, expect) without importing
    globals: true,
    
    // Run tests in jsdom environment (simulates browser)
    environment: 'jsdom',
    
    // Set environment variables for tests
    env: {
      VITE_API_URL: 'http://localhost:5001/api',
    },
    
    // Run setup files before all tests
    setupFiles: ['./src/__tests__/setup.js'],
    
    // Coverage reporting configuration
    coverage: {
      // Use v8 for coverage (pre-installed with vitest)
      provider: 'v8',
      
      // Generate multiple report formats
      reporter: ['text', 'json', 'html', 'lcov'],
      
      // Exclude test files from coverage
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.jsx',
      ],
      
      // Minimum coverage thresholds
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
  
  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
