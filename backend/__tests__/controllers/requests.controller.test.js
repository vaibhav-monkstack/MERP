/**
 * Requests Controller Unit Tests
 * 
 * Tests for material request workflows:
 * - GET all requests
 * - POST new request with inventory validation
 * - PUT update request status (Pending → Approved/Denied)
 * - DELETE request
 * 
 * Key: Approving a request auto-deducts from inventory!
 * Test coverage: 15 tests (BC-021 to BC-035)
 */

const pool = require('../../config/db');
const { getRequests, addRequest, updateRequestStatus, deleteRequest } = require('../../controllers/requestsController');

// Mock the pool - prevents real database calls during tests
jest.mock('../../config/db');

// Mock the stock controller - isolates request tests from movement recording
jest.mock('../../controllers/stockController', () => ({
  recordStockMovement: jest.fn().mockResolvedValue(undefined),
}));

describe('Requests Controller - Unit Tests', () => {
  let mockRequest, mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-initialize pool.query as a Jest mock function after clearAllMocks
    pool.query = jest.fn();
    
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getRequests', () => {
    /**
     * BC-021: Get all requests successfully
     * Expected: Return array of all material requests with full details
     * Ordered: By requested_at DESC (most recent first)
     */
    test('BC-021: Get all requests successfully', async () => {
      // ARRANGE: Mock material request data
      const mockRequests = [
        { id: 2, request_id: 'REQ-002', material: 'Copper', quantity: 30, status: 'Approved', requested_at: '2024-01-15' },
        { id: 1, request_id: 'REQ-001', material: 'Steel', quantity: 100, status: 'Pending', requested_at: '2024-01-14' },
      ];
      pool.query.mockResolvedValueOnce([mockRequests]); // Returns [rows, ...]

      // ACT: Get all requests
      await getRequests(mockRequest, mockResponse);

      // ASSERT: Returns success response with request data array
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockRequests });
    });

    /**
     * BC-022: Get requests from empty database
     * Expected: Return empty array without error
     */
    test('BC-022: Get requests from empty DB', async () => {
      // ARRANGE: Mock empty requests table
      pool.query.mockResolvedValueOnce([[]]);

      // ACT: Get requests when none exist
      await getRequests(mockRequest, mockResponse);

      // ASSERT: Empty data array with success status
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    /**
     * BC-023: Handle database error gracefully
     * Expected: Return 500 error when database connection fails
     */
    test('BC-023: Handle getRequests DB error', async () => {
      // ARRANGE: Mock database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // ACT: Get requests with DB error
      await getRequests(mockRequest, mockResponse);

      // ASSERT: Return 500 error response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Database error' });
    });
  });

  describe('addRequest', () => {
    /**
     * BC-024: Create request successfully
     * Expected: New request created with status='Pending' and returns 201 Created
     * Validates: Material exists and has sufficient quantity
     */
    test('BC-024: Create request successfully', async () => {
      // ARRANGE: Request to create new material request
      mockRequest.body = {
        job_id: 1,
        material: 'Steel',
        quantity: 50,
        requested_by: 'John Doe',
      };

      // ARRANGE: Mock material found and insert succeeds
      const material = { id: 1, name: 'Steel', quantity: 100, min_stock: 20 };
      pool.query
        .mockResolvedValueOnce([[material]]) // Returns [rows, ...] - Material exists and has qty available
        .mockResolvedValueOnce([{ insertId: 1 }]); // Returns [result, ...] - Insert successful

      // ACT: Create request
      await addRequest(mockRequest, mockResponse);

      // ASSERT: Returns 201 Created with request details
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Request created',
        data: expect.objectContaining({
          id: 1,
          material: 'Steel',
          quantity: 50,
          status: 'Pending',
        }),
      });
    });

    /**
     * BC-025: Create request without required material field
     * Expected: Return 400 Bad Request with validation error
     */
    test('BC-025: Create request without material', async () => {
      // ARRANGE: Request missing material name
      mockRequest.body = {
        job_id: 1,
        quantity: 50,
        requested_by: 'John',
        // missing: material
      };

      // ACT: Try to create request without material
      await addRequest(mockRequest, mockResponse);

      // ASSERT: Return 400 validation error
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Material and positive quantity are required.',
      });
    });

    /**
     * BC-026: Create request exceeding available inventory
     * Expected: Return 400 error when request qty > available qty
     */
    test('BC-026: Create request with insufficient inventory', async () => {
      // ARRANGE: Request for 50 units but only 20 available
      mockRequest.body = {
        job_id: 1,
        material: 'Steel',
        quantity: 50,
        requested_by: 'John',
      };

      // ARRANGE: Material has insufficient stock
      const material = { id: 1, name: 'Steel', quantity: 20, min_stock: 20 }; // Only 20 available
      pool.query.mockResolvedValueOnce([[material]]); // Returns [rows, ...]

      // ACT: Try to create request with insufficient inventory
      await addRequest(mockRequest, mockResponse);

      // ASSERT: Return 400 error for insufficient inventory
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot create request because available inventory is less than requested quantity.',
      });
    });

    /**
     * BC-027: Create request for non-existent material
     * Expected: Return 400 error when material not in database
     */
    test('BC-027: Create request for non-existent material', async () => {
      // ARRANGE: Request for material that doesn't exist
      mockRequest.body = {
        job_id: 1,
        material: 'NonExistent',
        quantity: 50,
        requested_by: 'John',
      };

      // ARRANGE: Material lookup returns empty
      pool.query.mockResolvedValueOnce([[], []]); // Returns [rows, ...] - Material not found

      // ACT: Try to create request for non-existent material
      await addRequest(mockRequest, mockResponse);

      // ASSERT: Return 400 material not found error
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Material not found in inventory. Cannot create request.',
      });
    });

    /**
     * BC-028: Create request for exact available quantity
     * Expected: Request accepted when quantity equals available (edge case)
     */
    test('BC-028: Create request with exact available quantity', async () => {
      // ARRANGE: Request exactly matches available quantity
      mockRequest.body = {
        job_id: 1,
        material: 'Steel',
        quantity: 50,
        requested_by: 'John',
      };

      // ARRANGE: Material exact qty = requested qty = 50
      const material = { id: 1, name: 'Steel', quantity: 50, min_stock: 20 }; // Exact quantity
      pool.query
        .mockResolvedValueOnce([[material]]) // Returns [rows, ...]
        .mockResolvedValueOnce([{ insertId: 1 }]); // Returns [result, ...]

      // ACT: Create request for exact quantity
      await addRequest(mockRequest, mockResponse);

      // ASSERT: Request created successfully
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Request created',
        data: expect.objectContaining({ quantity: 50 }),
      });
    });
  });

  describe('updateRequestStatus', () => {
    /**
     * BC-029: Approve request auto-deducts inventory
     * Expected: When request status changed to 'Approved', material quantity automatically decreased
     * Side Effect: Stock movement audit trail created, recordStockMovement called
     */
    test('BC-029: Approve request deducts inventory', async () => {
      // ARRANGE: Import mocked recordStockMovement
      const { recordStockMovement } = require('../../controllers/stockController');
      mockRequest.params = { id: 1 };
      mockRequest.body = { status: 'Approved' };

      // ARRANGE: Mock request and material data
      const request = { id: 1, material: 'Steel', quantity: 30, status: 'Pending', job_id: 1 };
      const material = { id: 1, name: 'Steel', quantity: 100, min_stock: 20 };

      pool.query
        .mockResolvedValueOnce([[request]]) // Returns [rows, ...] - SELECT request
        .mockResolvedValueOnce([[material]]) // Returns [rows, ...] - SELECT material
        .mockResolvedValueOnce([{}]); // Returns [result, ...] - UPDATE request status

      // ACT: Approve request
      await updateRequestStatus(mockRequest, mockResponse);

      // ASSERT: Material quantity deducted (100 - 30 = 70)
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE materials SET quantity=? WHERE id=?',
        [70, 1] // 100 - 30 = 70
      );
    });

    /**
     * BC-030: Deny/Reject request doesn't deduct inventory
     * Expected: When request status changed to 'Rejected', material quantity unchanged
     */
    test('BC-030: Deny request doesn\'t deduct inventory', async () => {
      // ARRANGE: Setup to reject request
      mockRequest.params = { id: 1 };
      mockRequest.body = { status: 'Rejected' };

      // ARRANGE: Mock request data
      const request = { id: 1, material: 'Steel', quantity: 30, status: 'Pending', job_id: 1 };
      pool.query.mockResolvedValueOnce([[request]]); // Returns [rows, ...]

      // ACT: Reject request
      await updateRequestStatus(mockRequest, mockResponse);

      // ASSERT: Material should NOT be updated (no deduction on rejection)
      const updateCalls = pool.query.mock.calls.filter(call => 
        call[0].includes('UPDATE materials')
      );
      expect(updateCalls).toHaveLength(0);
    });

    /**
     * BC-031: Update request with invalid status
     * Expected: Return 400 error for status not in ['Approved', 'Rejected', 'Pending']
     */
    test('BC-031: Update request with invalid status', async () => {
      // ARRANGE: Try to set invalid status
      mockRequest.params = { id: 1 };
      mockRequest.body = { status: 'InvalidStatus' };

      // ACT: Try to update with invalid status
      await updateRequestStatus(mockRequest, mockResponse);

      // ASSERT: Return 400 validation error
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid status value',
      });
    });

    /**
     * BC-032: Update non-existent request
     * Expected: Return 404 Not Found when request ID doesn't exist
     */
    test('BC-032: Update non-existent request', async () => {
      // ARRANGE: Try to update request that doesn't exist
      mockRequest.params = { id: 999 };
      mockRequest.body = { status: 'Approved' };

      // ARRANGE: Mock no request found
      pool.query.mockResolvedValueOnce([[], []]); // Returns [rows, ...] - Request not found

      // ACT: Try to update non-existent request
      await updateRequestStatus(mockRequest, mockResponse);

      // ASSERT: Return 404 error
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Request not found',
      });
    });

    /**
     * BC-033: Update request prevents double deduction
     * Expected: Already-approved request updated to 'Approved' doesn't deduct again
     * Validates: Idempotent update - only deduct on first approval
     */
    test('BC-033: Update request prevents double deduction', async () => {
      // ARRANGE: Request already in 'Approved' status
      mockRequest.params = { id: 1 };
      mockRequest.body = { status: 'Approved' };

      // ARRANGE: Mock request already approved
      const request = { id: 1, material: 'Steel', quantity: 30, status: 'Approved', job_id: 1 }; // Already approved
      pool.query.mockResolvedValueOnce([[request]]); // Returns [rows, ...]

      // ACT: Try to approve already-approved request
      await updateRequestStatus(mockRequest, mockResponse);

      // ASSERT: Material should NOT be updated (no double deduction)
      const updateCalls = pool.query.mock.calls.filter(call => 
        call[0].includes('UPDATE materials')
      );
      expect(updateCalls).toHaveLength(0);
    });
  });

  describe('deleteRequest', () => {
    /**
     * BC-034: Delete pending request successfully
     * Expected: Remove request from database and return success message
     * Allowed: Only when request is in 'Pending' status (before approval deducts inventory)
     */
    test('BC-034: Delete pending request', async () => {
      // ARRANGE: Setup request ID to delete
      mockRequest.params = { id: 1 };

      // ARRANGE: Mock database delete operation
      pool.query.mockResolvedValueOnce([{}]);

      // ACT: Delete the request
      await deleteRequest(mockRequest, mockResponse);

      // ASSERT: Verify DELETE query executed with correct request ID
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM requests WHERE id=?', [1]);
      // ASSERT: Success response returned
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, message: 'Request deleted successfully' });
    });

    /**
     * BC-035: Delete non-existent request
     * Expected: Handle gracefully with 500 error when DELETE fails
     */
    test('BC-035: Delete non-existent request', async () => {
      // ARRANGE: Try to delete request that doesn't exist
      mockRequest.params = { id: 999 };

      // ARRANGE: Mock database error
      pool.query.mockRejectedValueOnce(new Error('Request not found'));

      // ACT: Try to delete non-existent request
      await deleteRequest(mockRequest, mockResponse);

      // ASSERT: Error response with 500 status
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
