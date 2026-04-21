process.env.NODE_ENV = 'test'; // Prevent DB connection during tests

const { 
  getOrders, getOrderStats, getOrderById, createOrder, 
  updateOrderStatus, updateOrder, deleteOrder 
} = require('../../../src/backend/controllers/orderController');
const pool = require('../../../src/backend/config/db');

// --- Simple Manual Mocking ---
let mockResults = [];
let mockError = null;
let allQueries = [];
let lastParams = [];

pool.query = async (query, params) => {
  allQueries.push(query);
  lastParams = params;
  if (mockError) throw mockError;
  const result = mockResults.shift();
  return result !== undefined ? result : [[]]; 
};

// --- Test Helper ---
const testResults = [];
async function it(desc, fn) {
  try {
    // Reset state before each test
    mockResults = [];
    mockError = null;
    allQueries = [];
    lastParams = [];
    
    await fn();
    console.log(`✅ PASSED: ${desc}`);
    testResults.push({ desc, status: 'PASSED' });
  } catch (err) {
    console.log(`❌ FAILED: ${desc}`);
    console.log(`   Error: ${err.message}\n   Stack: ${err.stack.split('\n')[1]}`);
    testResults.push({ desc, status: 'FAILED', error: err.message });
  }
}

function expect(actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

// --- Mock Response Helper ---
const createMockRes = (checkFn) => {
  const res = {
    _status: 200,
    status: function(s) { this._status = s; return this; },
    json: function(data) { 
      if (checkFn) checkFn(data, this._status);
      return this;
    }
  };
  return res;
};

// --- Test Suite ---
async function runAllTests() {
  console.log('--- ORDER MANAGEMENT MODULE: 7 BACKEND UNIT TESTS ---\n');

  // 1. getOrders
  await it('should fetch all orders', async () => {
    const mockData = [{ id: 1, customer_name: 'John' }];
    mockResults = [[mockData]]; // mysql2 returns [rows, fields]
    const res = createMockRes((data) => {
      expect(data.success, true);
      expect(data.data, mockData);
    });
    await getOrders({ query: {} }, res);
  });

  // 2. getOrders with Filters (Search)
  await it('should filter orders by search term', async () => {
    mockResults = [[[]]];
    const res = createMockRes();
    await getOrders({ query: { search: 'TestItem' } }, res);
    if (!allQueries.some(q => q.includes('LIKE ?'))) throw new Error('Query should include LIKE for search');
  });

  // 3. getOrderStats
  await it('should fetch order summary stats', async () => {
    const mockStats = { total: 10, new: 5 };
    mockResults = [[ [mockStats] ]]; // rows[0] should be mockStats
    const res = createMockRes((data) => {
      expect(data.success, true);
      expect(data.data, mockStats);
    });
    await getOrderStats({}, res);
  });

  // 4. getOrderById (404 Edge Case)
  await it('should return 404 for missing order', async () => {
    mockResults = [[[]]]; // items.length === 0
    const res = createMockRes((data, status) => {
      expect(status, 404);
      expect(data.success, false);
    });
    await getOrderById({ params: { id: 999 } }, res);
  });

  // 5. createOrder (400 Edge Case: Missing Fields)
  await it('should return 400 for missing required fields', async () => {
    const res = createMockRes((data, status) => {
      expect(status, 400);
      expect(data.success, false);
    });
    await createOrder({ body: { customer_name: 'John' } }, res);
  });

  // 6. updateOrderStatus
  await it('should update order status successfully', async () => {
    mockResults = [[{ affectedRows: 1 }]]; // result.affectedRows
    const res = createMockRes((data) => {
      expect(data.success, true);
    });
    await updateOrderStatus({ params: { id: 1 }, body: { status: 'confirmed' } }, res);
    if (!allQueries.some(q => q.includes('UPDATE orders SET status=?'))) throw new Error('Wrong update query');
  });

  // 7. deleteOrder
  await it('should delete order and customer profile', async () => {
    mockResults = [
       [[{ customer_name: 'John' }]], // Select result: [rows] -> rows[0].customer_name
       [{}],                         // Delete order
       [{}]                          // Delete customer
    ];
    const res = createMockRes((data) => {
      expect(data.success, true);
    });
    await deleteOrder({ params: { id: 1 } }, res);
    if (!allQueries.some(q => q.includes('DELETE FROM customers'))) throw new Error('Customer should be deleted');
  });

  console.log('\n--- TEST SUMMARY ---');
  const passed = testResults.filter(r => r.status === 'PASSED').length;
  console.log(`Total: ${testResults.length}, Passed: ${passed}, Failed: ${testResults.length - passed}`);
  
  if (passed !== testResults.length) process.exit(1);
}

runAllTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
