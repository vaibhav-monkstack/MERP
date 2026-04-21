const { getOrders, getOrderStats, getOrderById, createOrder, updateOrderStatus, updateOrder, deleteOrder } = require('../../../src/backend/controllers/orderController');
const pool = require('../../../src/backend/config/db');
const automation = require('../../../src/backend/utils/automation');

// Mock the database pool
jest.mock('../../../src/backend/config/db', () => ({
  query: jest.fn(),
}));

// Mock automation utility
jest.mock('../../../src/backend/utils/automation', () => ({
  handleMaterialCheck: jest.fn(),
}));

describe('Order Controller Backend Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  // 1. getOrders success
  it('should fetch all orders successfully', async () => {
    const mockOrders = [{ id: 1, customer_name: 'John Doe', item_name: 'Widget' }];
    pool.query.mockResolvedValueOnce([mockOrders]);

    await getOrders(req, res);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM orders'), expect.any(Array));
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockOrders });
  });

  // 2. getOrders with filters (search/status)
  it('should fetch filtered orders by status and search', async () => {
    req.query = { status: 'new', search: 'Widget' };
    pool.query.mockResolvedValueOnce([[]]);

    await getOrders(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE status = ? AND (customer_name LIKE ? OR item_name LIKE ? OR id LIKE ?)'),
      ['new', '%Widget%', '%Widget%', '%Widget%']
    );
  });

  // 3. getOrderStats success
  it('should fetch order statistics successfully', async () => {
    const mockStats = { total: 10, new: 5, processing: 3, shipped: 2, delivered: 0, cancelled: 0 };
    pool.query.mockResolvedValueOnce([[mockStats]]);

    await getOrderStats(req, res);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockStats });
  });

  // 4. getOrderById - 404 Case (Edge Case)
  it('should return 404 when order is not found', async () => {
    req.params.id = 999;
    pool.query.mockResolvedValueOnce([[]]); // No order found

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Order not found' });
  });

  // 5. createOrder - 400 Case (Edge Case: Missing Fields)
  it('should return 400 when required fields are missing during creation', async () => {
    req.body = { customer_name: 'John Doe' }; // Missing item_name, quantity, price

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Missing required fields' });
  });

  // 6. updateOrderStatus success
  it('should update order status and trigger automation if necessary', async () => {
    req.params.id = 1;
    req.body = { status: 'awaiting_materials', remarks: 'Checking stock' };
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update success
    pool.query.mockResolvedValueOnce(); // History log (mockResolvedValueOnce for safety)

    await updateOrderStatus(req, res);

    expect(pool.query).toHaveBeenCalledWith('UPDATE orders SET status=? WHERE id=?', ['awaiting_materials', 1]);
    expect(automation.handleMaterialCheck).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Status updated' });
  });

  // 7. deleteOrder success
  it('should delete order and its associated customer profile', async () => {
    req.params.id = 1;
    pool.query
      .mockResolvedValueOnce([[{ customer_name: 'John Doe' }]]) // SELECT customer_name
      .mockResolvedValueOnce() // DELETE order
      .mockResolvedValueOnce(); // DELETE customer

    await deleteOrder(req, res);

    expect(pool.query).toHaveBeenCalledWith('DELETE FROM orders WHERE id = ?', [1]);
    expect(pool.query).toHaveBeenCalledWith('DELETE FROM customers WHERE name = ?', ['John Doe']);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Order and associated customer profile deleted successfully',
    });
  });
});
