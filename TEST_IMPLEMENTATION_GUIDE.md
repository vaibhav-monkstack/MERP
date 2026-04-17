# Quick Reference: Implementing Inventory Management Tests

## 1. BACKEND TESTING SETUP

### Install Testing Dependencies
```bash
cd backend
npm install --save-dev jest supertest @testing-library/jest-dom
npm install --save-dev dotenv
```

### Create Directory Structure
```
backend/
├── __tests__/
│   ├── controllers/
│   │   ├── materials.controller.test.js
│   │   ├── stock.controller.test.js
│   │   ├── requests.controller.test.js
│   │   └── reports.controller.test.js
│   ├── integration/
│   │   ├── materials-api.test.js
│   │   ├── requests-api.test.js
│   │   ├── orders-api.test.js
│   │   └── workflows.test.js
│   └── fixtures/
│       ├── materials.fixture.js
│       ├── requests.fixture.js
│       └── orders.fixture.js
├── jest.config.js
└── package.json
```

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific test file
npm test -- controllers/materials.controller.test.js
```

---

## 2. FRONTEND TESTING SETUP

### Install Testing Dependencies
```bash
cd frontend
npm install --save-dev vitest react-testing-library @testing-library/jest-dom jsdom
npm install --save-dev msw
npm install --save-dev @vitest/ui
```

### Create Directory Structure
```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── Dashboard.test.jsx
│   │   ├── Materials.test.jsx
│   │   ├── Requests.test.jsx
│   │   └── Orders.test.jsx
│   ├── pages/
│   │   ├── inventory/
│   │   │   ├── Dashboard.page.test.jsx
│   │   │   └── Materials.page.test.jsx
│   │   └── ...
│   ├── integration/
│   │   ├── workflows.test.jsx
│   │   └── low-stock-flow.test.jsx
│   ├── mocks/
│   │   ├── handlers.js
│   │   ├── server.js
│   │   └── data.js
│   └── fixtures/
│       └── inventory.fixtures.js
├── vitest.config.js
└── package.json
```

### Vitest Configuration (vitest.config.js)
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```

### Mock Service Worker Setup (mocks/handlers.js)
```javascript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Materials
  http.get('http://localhost:5000/api/materials', () => {
    return HttpResponse.json([
      { id: 1, name: 'Steel', quantity: 500, min_stock: 100, price: 50 },
      { id: 2, name: 'Copper', quantity: 20, min_stock: 50, price: 75 },
    ]);
  }),

  http.post('http://localhost:5000/api/materials', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 3, ...body },
      { status: 201 }
    );
  }),

  // Requests
  http.get('http://localhost:5000/api/requests', () => {
    return HttpResponse.json([
      { id: 'REQ-001', material_id: 1, qty: 100, status: 'Pending' },
    ]);
  }),

  http.post('http://localhost:5000/api/requests/:id', () => {
    return HttpResponse.json({ status: 'Approved' });
  }),
];
```

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# UI mode (visual interface)
npm test -- --ui

# Coverage report
npm test -- --coverage

# Specific file
npm test -- Materials.test.jsx
```

---

## 3. SAMPLE TEST IMPLEMENTATIONS

### Backend Unit Test Example (materials.controller.test.js)
```javascript
const { getMaterials, addMaterial, updateMaterial, deleteMaterial } = require('../../controllers/materialsController');
const db = require('../../config/db');

describe('Materials Controller', () => {
  beforeEach(() => {
    // Clear DB before each test
    db.exec('DELETE FROM materials');
    db.exec('DELETE FROM stock_movements');
  });

  describe('getMaterials', () => {
    test('BC-001: Get all materials successfully', async () => {
      // Setup
      const stmt = db.prepare('INSERT INTO materials (name, quantity, min_stock, price) VALUES (?, ?, ?, ?)');
      stmt.run('Steel', 500, 100, 50);
      stmt.run('Copper', 20, 50, 75);
      stmt.run('Aluminum', 300, 150, 40);

      // Execute
      const materials = getMaterials();

      // Assert
      expect(materials).toHaveLength(3);
      expect(materials[0]).toMatchObject({
        name: 'Steel',
        quantity: 500,
        min_stock: 100,
      });
    });

    test('BC-002: Get materials from empty DB', () => {
      const materials = getMaterials();
      expect(materials).toEqual([]);
    });

    test('BC-003: Get materials includes low stock flag', () => {
      const stmt = db.prepare('INSERT INTO materials (name, quantity, min_stock, price) VALUES (?, ?, ?, ?)');
      stmt.run('Steel', 2, 5, 50); // qty < min_stock

      const materials = getMaterials();
      expect(materials[0].lowStock).toBe(true);
    });
  });

  describe('addMaterial', () => {
    test('BC-004: Add new material successfully', () => {
      const newMaterial = addMaterial({ name: 'Steel', quantity: 100, min_stock: 20, price: 50 });

      expect(newMaterial.id).toBeDefined();
      expect(newMaterial.name).toBe('Steel');
      expect(newMaterial.quantity).toBe(100);
    });

    test('BC-005: Add material triggers auto-deduplication', () => {
      // Add first material
      addMaterial({ name: 'Steel', quantity: 50, min_stock: 20, price: 50 });
      
      // Add duplicate
      const result = addMaterial({ name: 'Steel', quantity: 30, min_stock: 20, price: 50 });
      
      const materials = getMaterials();
      expect(materials).toHaveLength(1);
      expect(materials[0].quantity).toBe(80);
    });

    test('BC-007: Add material without required fields', () => {
      expect(() => {
        addMaterial({ name: 'Steel' }); // missing qty and min_stock
      }).toThrow('Required fields missing');
    });
  });
});
```

### Frontend Component Test Example (Materials.test.jsx)
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Materials from '../pages/inventory/Materials';
import * as api from '../api/api';

vi.mock('../api/api');

describe('Materials Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('FE-008: Materials table displays', async () => {
    // Mock API
    api.getMaterials.mockResolvedValue([
      { id: 1, name: 'Steel', quantity: 500, min_stock: 100, price: 50 },
      { id: 2, name: 'Copper', quantity: 20, min_stock: 50, price: 75 },
      { id: 3, name: 'Aluminum', quantity: 300, min_stock: 150, price: 40 },
      { id: 4, name: 'Brass', quantity: 100, min_stock: 80, price: 60 },
      { id: 5, name: 'Titanium', quantity: 50, min_stock: 40, price: 150 },
    ]);

    // Render
    render(<Materials />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Steel')).toBeInTheDocument();
    });

    // Assert
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('Copper')).toBeInTheDocument();
    expect(screen.getByText('Aluminum')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6); // 1 header + 5 data rows
  });

  test('FE-009: Search materials by name', async () => {
    api.getMaterials.mockResolvedValue([
      { id: 1, name: 'Steel', quantity: 500, min_stock: 100, price: 50 },
      { id: 2, name: 'Copper', quantity: 20, min_stock: 50, price: 75 },
    ]);

    const user = userEvent.setup();
    render(<Materials />);

    await waitFor(() => {
      expect(screen.getByText('Steel')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search materials...');
    await user.type(searchInput, 'Steel');

    await waitFor(() => {
      expect(screen.getByText('Steel')).toBeInTheDocument();
      expect(screen.queryByText('Copper')).not.toBeInTheDocument();
    });
  });

  test('FE-011: Add material form', async () => {
    api.getMaterials.mockResolvedValue([]);
    api.addMaterial.mockResolvedValue({ id: 1, name: 'Steel', quantity: 100, min_stock: 20, price: 50 });

    const user = userEvent.setup();
    render(<Materials />);

    // Open form and fill
    const addBtn = screen.getByRole('button', { name: /add material/i });
    await user.click(addBtn);

    const nameInput = screen.getByLabelText('Material Name');
    const qtyInput = screen.getByLabelText('Quantity');
    const minStockInput = screen.getByLabelText('Min Stock');
    const priceInput = screen.getByLabelText('Price');

    await user.type(nameInput, 'Steel');
    await user.type(qtyInput, '100');
    await user.type(minStockInput, '20');
    await user.type(priceInput, '50');

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    await user.click(submitBtn);

    // Assert POST was called
    expect(api.addMaterial).toHaveBeenCalledWith({
      name: 'Steel',
      quantity: 100,
      min_stock: 20,
      price: 50,
    });
  });
});
```

---

## 4. TEST EXECUTION CHECKLIST

### Pre-Test Checklist
- [ ] Backend: Install Jest, Supertest, fixtures
- [ ] Frontend: Install Vitest, React Testing Library, MSW
- [ ] Create test directories
- [ ] Database test seeds ready
- [ ] API mocks configured

### Running Tests

**Backend:**
```bash
# Unit tests first
npm test -- controllers/

# Integration tests
npm test -- integration/

# Full coverage report
npm test -- --coverage
```

**Frontend:**
```bash
# Component tests
npm test -- components/

# Integration tests
npm test -- integration/

# With UI
npm test -- --ui
```

### Coverage Goals
- **Unit Tests:** 85%+ coverage
- **Integration Tests:** All critical paths
- **E2E Tests:** Main user workflows

---

## 5. CONTINUOUS INTEGRATION

### GitHub Actions Example (.github/workflows/test.yml)
```yaml
name: Inventory Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test -- --coverage
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## 6. QUICK COMMAND REFERENCE

```bash
# Backend
cd backend
npm test                           # Run all tests
npm test -- --watch               # Watch mode
npm test -- --coverage            # Coverage report
npm test -- materials.test.js     # Single file
npm test -- --testNamePattern="BC-001"  # Specific test

# Frontend
cd frontend
npm test                           # Run all tests
npm test -- --watch               # Watch mode
npm test -- --coverage            # Coverage report
npm test -- --ui                  # Visual UI
npm test -- Materials.test.jsx    # Single file
npm test -- --reporter=verbose    # Detailed output
```

---

## 7. NEXT STEPS

1. **Week 1:** Implement backend unit tests (Materials, Stock, Requests controllers)
2. **Week 2:** Implement backend integration tests + frontend component tests
3. **Week 3:** Frontend integration tests + E2E workflows
4. **Week 4:** Performance testing + edge cases

Start with **BC-001 through BC-010** to establish testing patterns!
