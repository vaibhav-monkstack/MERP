import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, './src/tests/setupTests.js')],
    include: ['../testing/frontend/**/*.test.{js,jsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Deep alias strategy to resolve dependencies from local node_modules even for outside files
      'react/jsx-dev-runtime': path.resolve(__dirname, './node_modules/react/jsx-dev-runtime'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      '@testing-library/react': path.resolve(__dirname, './node_modules/@testing-library/react'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'vitest': path.resolve(__dirname, './node_modules/vitest'),
      'msw': path.resolve(__dirname, './node_modules/msw'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
