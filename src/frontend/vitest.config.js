import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    env: {
      VITE_API_URL: 'http://localhost:5001/api',
    },
    // Run unified setup files before all tests
    setupFiles: [
      path.resolve(__dirname, '../../tests/frontend-setup.js'),
    ],
    
    // Explicitly include test directories outside the root
    include: [path.resolve(__dirname, '../../tests/**/frontend/**/*.test.{js,jsx}').replace(/\\/g, '/')],
    esbuild: {
      jsxInject: `import React from 'react'`,
    },
    
    // Coverage reporting configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '../../tests/**/mocks/',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@testing-library/jest-dom': path.resolve(__dirname, 'node_modules/@testing-library/jest-dom'),
      '@testing-library/react': path.resolve(__dirname, 'node_modules/@testing-library/react'),
      '@testing-library/user-event': path.resolve(__dirname, 'node_modules/@testing-library/user-event'),
      'msw': path.resolve(__dirname, 'node_modules/msw'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      'chart.js': path.resolve(__dirname, 'node_modules/chart.js'),
      'react-chartjs-2': path.resolve(__dirname, 'node_modules/react-chartjs-2'),
      'axios': path.resolve(__dirname, 'node_modules/axios'),
    },
  },
  
  // Allow accessing test files outside of the project root
  server: {
    fs: {
      strict: false,
      allow: ['../..'],
    },
  },
});
