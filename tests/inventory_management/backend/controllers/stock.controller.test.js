/**
 * Stock Controller Unit Tests
 * 
 * Tests for inventory tracking and audit logging:
 * - Recording stock movements (additions, deletions, adjustments)
 * - Retrieving stock movement history
 * - Quantity change tracking
 * 
 * Test coverage: 10 tests (BC-013 to BC-020)
 */

const pool = require('../../../../src/backend/config/db');
const { recordStockMovement, getStockMovements } = require('../../../../src/backend/controllers/stockController');

// Mock the pool - prevents real database calls during tests
jest.mock('../../../../src/backend/config/db');

describe('Stock Controller - Unit Tests', () => {
  let mockRequest, mockResponse;

  // Reset mocks before each test for isolation
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-initialize pool.query as a Jest mock function after clearAllMocks
    pool.query = jest.fn();
    
    // Mock Express request/response objects
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('recordStockMovement', () => {
    test('BC-013: Record movement with all fields', async () => {
      // ARRANGE: Create test data for stock movement
      const material = { id: 1, name: 'Steel', quantity: 150 };
      pool.query.mockResolvedValueOnce([{}]);

      // ACT: Record the movement
      await recordStockMovement(
        material,
        'Adjustment',      // Type of change
        50,               // Quantity changed
        150,              // Resulting quantity
        'Manual adjustment',  // Note
        'Material',       // Reference type
        1                 // Reference ID
      );

      // ASSERT: Verify INSERT was called with correct data
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO stock_movements (material_id, material_name, change_type, quantity_change, resulting_quantity, reference_type, reference_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [1, 'Steel', 'Adjustment', 50, 150, 'Material', 1, 'Manual adjustment']
      );
    });

    test('BC-014: Record movement with negative quantity', async () => {
      // ARRANGE: Test deduction/removal
      const material = { id: 1, name: 'Steel' };
      pool.query.mockResolvedValueOnce([{}]);

      // ACT: Record negative quantity change (stock deduction)
      await recordStockMovement(
        material,
        'Request Approved',
        -50,              // Negative = removal
        100,              // Result after removal
        'Request deduction',
        'Request',
        'REQ-001'
      );

      // ASSERT: Should record negative quantity
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([-50])  // Negative quantity
      );
    });

    test('BC-015: Record movement handles DB error gracefully', async () => {
      // ARRANGE: Simulate database failure
      const material = { id: 1, name: 'Steel' };
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      // ACT & ASSERT: Should not throw error
      await expect(
        recordStockMovement(material, 'Adjustment', 50, 150, 'Test')
      ).resolves.not.toThrow();
    });

    test('BC-016: Record movement with null reference', async () => {
      // ARRANGE: Test recording without reference (reference fields optional)
      const material = { id: 1, name: 'Steel' };
      pool.query.mockResolvedValueOnce([{}]);

      // ACT: Record movement without referencing  specific request/order
      await recordStockMovement(
        material,
        'Initial Stock',
        100,
        100,
        'Initial quantity'
        // No reference type or ID
      );

      // ASSERT: Should record with null reference fields
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null, null])  // referenceType and referenceId are null
      );
    });
  });

  describe('getStockMovements', () => {
    test('BC-017: Get movements ordered by date DESC', async () => {
      // ARRANGE: Create test movements data (most recent first)
      const mockMovements = [
        { id: 3, material_name: 'Steel', change_type: 'Adjustment', quantity_change: 50, created_at: '2024-01-15' },
        { id: 2, material_name: 'Steel', change_type: 'Request Approved', quantity_change: -30, created_at: '2024-01-14' },
        { id: 1, material_name: 'Steel', change_type: 'Initial Stock', quantity_change: 100, created_at: '2024-01-13' },
      ];
      pool.query.mockResolvedValueOnce([mockMovements]);

      // ACT: Get all movements
      await getStockMovements(mockRequest, mockResponse);

      // ASSERT: Verify response and ordering
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockMovements });
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM stock_movements ORDER BY created_at DESC');
    });

    test('BC-018: Get movements from empty table', async () => {
      // ARRANGE: No movements yet
      pool.query.mockResolvedValueOnce([[]]);

      // ACT: Get movements
      await getStockMovements(mockRequest, mockResponse);

      // ASSERT: Should return empty array
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    test('BC-019: Handle getStockMovements DB error', async () => {
      // ARRANGE: Simulate DB failure
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // ACT: Get movements
      await getStockMovements(mockRequest, mockResponse);

      // ASSERT: Should return error response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
      });
    });

    test('BC-020: Get movements includes quantity change tracking', async () => {
      // ARRANGE: Test data with detailed tracking info
      const mockMovements = [
        { 
          id: 1, 
          material_name: 'Steel', 
          change_type: 'Manual Adjustment', 
          quantity_change: -20,
          resulting_quantity: 480,
          reference_type: 'Material',
          reference_id: 1,
          note: 'Qty changed from 500 to 480'
        },
      ];
      pool.query.mockResolvedValueOnce([mockMovements]);

      // ACT: Get movements
      await getStockMovements(mockRequest, mockResponse);

      // ASSERT: Response should include all tracking fields
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            quantity_change: -20,
            resulting_quantity: 480,
          }),
        ]),
      });
    });
  });
});
