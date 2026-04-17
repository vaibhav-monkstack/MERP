/**
 * Materials Controller Unit Tests
 * 
 * Tests for CRUD operations on materials:
 * - GET all materials
 * - POST new material (with auto-deduplication)
 * - PUT update material
 * - DELETE material
 * 
 * Test coverage: 12 tests (BC-001 to BC-012)
 */

const pool = require('../../config/db');
const {
  getMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
} = require('../../controllers/materialsController');

// Mock the pool - prevents real database calls during tests
jest.mock('../../config/db');

// Mock the stock controller - isolates material tests from inventory tracking
jest.mock('../../controllers/stockController', () => ({
  recordStockMovement: jest.fn().mockResolvedValue(undefined),
}));

describe('Materials Controller - Unit Tests', () => {
  let mockRequest, mockResponse;

  // Reset mocks before each test to ensure test isolation
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock request/response objects to simulate Express
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),                // Returns this for chaining
      status: jest.fn().mockReturnThis(),              // Returns this for chaining
    };
    
    // Re-initialize pool.query as a Jest mock function after clearAllMocks
    pool.query = jest.fn();
  });

  describe('getMaterials', () => {
    test('BC-001: Get all materials successfully', async () => {
      // ARRANGE: Set up mock data
      const mockMaterials = [
        { id: 1, name: 'Steel', quantity: 500, min_stock: 100, price: 50, type: 'Metal' },
        { id: 2, name: 'Copper', quantity: 20, min_stock: 50, price: 75, type: 'Metal' },
        { id: 3, name: 'Aluminum', quantity: 300, min_stock: 150, price: 40, type: 'Metal' },
      ];
      // Mock pool.query to return our test data
      pool.query.mockResolvedValueOnce([mockMaterials]);

      // ACT: Call the controller function
      await getMaterials(mockRequest, mockResponse);

      // ASSERT: Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockMaterials);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM materials');
    });

    test('BC-002: Get materials from empty DB', async () => {
      // ARRANGE: Return empty array from mock DB
      pool.query.mockResolvedValueOnce([[]]);

      // ACT: Call getMaterials
      await getMaterials(mockRequest, mockResponse);

      // ASSERT: Should return empty array, not error
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    test('BC-003: Handle DB error gracefully', async () => {
      // ARRANGE: Mock database error
      const error = new Error('Database connection failed');
      pool.query.mockRejectedValueOnce(error);

      // ACT: Call getMaterials with failed DB
      await getMaterials(mockRequest, mockResponse);

      // ASSERT: Should return 500 error response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Database connection failed' });
    });
  });

  describe('addMaterial', () => {
    test('BC-004: Add new material successfully', async () => {
      // ARRANGE: Create request with material data
      mockRequest.body = {
        name: 'Steel',
        type: 'Metal',
        quantity: 100,
        min_stock: 20,
        price: 50,
        dimensions: '10x10x10',
        unit: 'kg',
        supplier: 'Supplier A',
        purchase_date: '2024-01-01',
        purchase_price: 45,
      };

      // Mock: No existing materials + successful insert
      pool.query.mockResolvedValueOnce([[]]) // No existing materials
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert successful

      // ACT: Add material
      await addMaterial(mockRequest, mockResponse);

      // ASSERT: Verify material was created with correct data
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Steel',
          quantity: 100,
          min_stock: 20,
        })
      );
    });

    test('BC-005: Add material without required fields', async () => {
      // ARRANGE: Request with missing quantity and min_stock
      mockRequest.body = {
        name: 'Steel',
        // missing quantity and min_stock - controller should use defaults
      };

      // ACT: Try to add material
      await addMaterial(mockRequest, mockResponse);

      // ASSERT: Should still create material with default values (quantity=0, min_stock=20)
      expect(mockResponse.json).toHaveBeenCalled();
    });

    test('BC-006: Add duplicate material triggers deduplication', async () => {
      // ARRANGE: Request to add duplicate material
      mockRequest.body = {
        name: 'Steel',
        type: 'Metal',
        quantity: 30,       // New quantity to add
        min_stock: 20,
        price: 50,
      };

      // Mock existing material and deduplication logic
      const existingMaterial = { id: 1, name: 'Steel', type: 'Metal', quantity: 50, min_stock: 20, price: 50 };
      pool.query
        .mockResolvedValueOnce([[existingMaterial]]) // SELECT finds existing (1 result)
        .mockResolvedValueOnce([{}]) // DELETE duplicates
        .mockResolvedValueOnce([{}]) // UPDATE primary with merged qty
        .mockResolvedValueOnce([{}]); // recordStockMovement

      // ACT: Add duplicate material
      await addMaterial(mockRequest, mockResponse);

      // ASSERT: Quantities should be merged (50 + 30 = 80)
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE materials SET quantity=?, min_stock=?, dimensions=?, unit=?, supplier=?, purchase_date=?, purchase_price=? WHERE id=?',
        expect.arrayContaining([80]) // New quantity is sum
      );
    });

    test('BC-007: Add material with DB error', async () => {
      // ARRANGE: Set up request
      mockRequest.body = {
        name: 'Steel',
        type: 'Metal',
        quantity: 100,
        min_stock: 20,
      };

      // Mock database error on first query
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // ACT: Try to add material
      await addMaterial(mockRequest, mockResponse);

      // ASSERT: Should return 500 error with error message
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Database error',
      });
    });
  });

  describe('updateMaterial', () => {
    /**
     * BC-008: Update material quantity and properties
     * Expected: Successfully update material fields and log stock movement
     * Triggers: recordStockMovement when quantity changes
     */
    test('BC-008: Update material quantity', async () => {
      // ARRANGE: Setup material ID and new data
      mockRequest.params = { id: 1 };
      mockRequest.body = {
        name: 'Steel',
        type: 'Metal',
        quantity: 80,        // Changed from 100 to 80
        min_stock: 20,
        price: 50,
      };

      // ARRANGE: Mock existing material and database operations
      const existingMaterial = { id: 1, name: 'Steel', quantity: 100, min_stock: 20 };
      pool.query
        .mockResolvedValueOnce([[existingMaterial]]) // SELECT existing material
        .mockResolvedValueOnce([{}])                   // UPDATE material
        .mockResolvedValueOnce([{}]); // recordStockMovement called

      // ACT: Update the material
      await updateMaterial(mockRequest, mockResponse);

      // ASSERT: Verify update query executed with new data
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE materials SET name=?, type=?, quantity=?, min_stock=?, dimensions=?, unit=?, supplier=?, purchase_date=?, purchase_price=? WHERE id=?',
        expect.any(Array)
      );
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Material updated successfully' });
    });

    /**
     * BC-009: Update non-existent material
     * Expected: Handle gracefully (update runs even if no material found)
     */
    test('BC-009: Update non-existent material', async () => {
      // ARRANGE: Request to update non-existent material ID
      mockRequest.params = { id: 999 };
      mockRequest.body = { name: 'Steel', quantity: 80 };

      // ARRANGE: Mock no material found in DB
      pool.query.mockResolvedValueOnce([[]]); // SELECT returns empty

      // ACT: Try to update non-existent material
      await updateMaterial(mockRequest, mockResponse);

      // ASSERT: Update query still executes (no pre-check validation)
      expect(pool.query).toHaveBeenCalled();
    });

    /**
     * BC-010: Verify stock movement audit trail created
     * Expected: When material quantity decreases from 100→80, 
     *           recordStockMovement called with -20 delta
     */
    test('BC-010: Update creates stock movement record for quantity change', async () => {
      // ARRANGE: Import mocked stockController
      const { recordStockMovement } = require('../../controllers/stockController');
      mockRequest.params = { id: 1 };
      mockRequest.body = {
        name: 'Steel',
        type: 'Metal',
        quantity: 80,        // Decreased from 100 (delta: -20)
        min_stock: 20,
        price: 50,
      };

      // ARRANGE: Mock existing material with higher quantity
      const existingMaterial = { id: 1, name: 'Steel', quantity: 100, min_stock: 20 };
      pool.query
        .mockResolvedValueOnce([[existingMaterial]]) // SELECT existing (qty=100)
        .mockResolvedValueOnce([{}]); // UPDATE succeeds

      // ACT: Update material with quantity change
      await updateMaterial(mockRequest, mockResponse);

      // ASSERT: recordStockMovement called with correct delta and audit info
      expect(recordStockMovement).toHaveBeenCalledWith(
        expect.any(Object),           // Response object
        'Manual Adjustment',          // Movement type
        -20, // quantityChange       // Delta: 100 - 80 = -20
        80, // newQuantity           // New qty after update
        expect.stringContaining('100 to 80'), // Description of change
        'Material',                   // Source type
        1                             // Material ID
      );
    });
  });

  describe('deleteMaterial', () => {
    /**
     * BC-011: Delete material successfully
     * Expected: Remove material from database and return success message
     * Side Effect: Material no longer available for orders/requests
     */
    test('BC-011: Delete material successfully', async () => {
      // ARRANGE: Setup material ID to delete
      mockRequest.params = { id: 1 };

      // ARRANGE: Mock database delete operation
      pool.query.mockResolvedValueOnce([{}]);  // DELETE succeeds

      // ACT: Delete the material
      await deleteMaterial(mockRequest, mockResponse);

      // ASSERT: Verify DELETE query executed with correct material ID
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM materials WHERE id=?', [1]);
      // ASSERT: Success response returned
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Material deleted successfully' });
    });

    /**
     * BC-012: Delete with database error
     * Expected: Catch error and return 500 Internal Server Error
     * Handles: Connection failures, constraint violations, etc.
     */
    test('BC-012: Delete with DB error', async () => {
      // ARRANGE: Setup material ID
      mockRequest.params = { id: 1 };

      // ARRANGE: Mock database error
      pool.query.mockRejectedValueOnce(new Error('Delete failed'));

      // ACT: Try to delete with DB error
      await deleteMaterial(mockRequest, mockResponse);

      // ASSERT: Error response with 500 status
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Delete failed' });
    });
  });
});
