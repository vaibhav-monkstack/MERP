/**
 * Mock Service Worker (MSW) API Handlers
 * 
 * These handlers intercept HTTP requests during tests and return mocked responses.
 * No real API calls are made during testing.
 * 
 * Handlers are organized by endpoint group:
 * - Materials API
 * - Requests API
 * - Purchase Orders API
 * - Reports API
 */

import { http, HttpResponse } from 'msw';

// API base URL - adjust if your backend runs on a different port
const API_URL = 'http://localhost:5001/api';

export const handlers = [
  // ========== MATERIALS ENDPOINTS ==========
  
  /**
   * GET /materials - Retrieve all materials
   * Used by: Materials page, Dashboard
   */
  http.get(`${API_URL}/materials`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Steel',
        type: 'Metal',
        quantity: 100,
        min_stock: 100,
        price: 50,
        unit: 'kg',
        dimensions: '10x10x10',
        supplier: 'Supplier A',
        purchase_date: '2024-01-01',
        purchase_price: 45,
      },
      {
        id: 2,
        name: 'Copper',
        type: 'Metal',
        quantity: 20,
        min_stock: 50,
        price: 75,
        unit: 'kg',
        dimensions: '5x5x5',
        supplier: 'Supplier B',
        purchase_date: '2024-01-05',
        purchase_price: 70,
      },
      {
        id: 3,
        name: 'Aluminum',
        type: 'Metal',
        quantity: 300,
        min_stock: 150,
        price: 40,
        unit: 'kg',
        dimensions: '15x15x15',
        supplier: 'Supplier C',
        purchase_date: '2024-01-10',
        purchase_price: 38,
      },
    ]);
  }),

  /**
   * POST /materials - Create new material
   * Used by: Materials form submission
   */
  http.post(`${API_URL}/materials`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: 4,                    // New ID
        ...body,                  // Include submitted data
        quantity: Number(body.quantity) || 0,
        min_stock: Number(body.min_stock) || 20,
      },
      { status: 201 }           // 201 Created status
    );
  }),

  /**
   * GET /materials/movements - Retrieve stock audit trail
   * Used by: MovementLog page
   */
  http.get(`${API_URL}/materials/movements`, () => {
    return HttpResponse.json([
      {
        id: 3,
        material_id: 1,
        material_name: 'Steel',
        change_type: 'Manual Adjustment',
        quantity_change: 50,
        resulting_quantity: 550,    // Balance after this change
        reference_type: 'Material',
        reference_id: 1,
        note: 'Manual stock adjustment',
        created_at: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        material_id: 1,
        material_name: 'Steel',
        change_type: 'Request Approved',
        quantity_change: -100,      // Negative = removal
        resulting_quantity: 500,
        reference_type: 'Request',
        reference_id: 'REQ-001',
        note: 'Request REQ-001 approved',
        created_at: '2024-01-14T09:15:00Z',
      },
      {
        id: 1,
        material_id: 1,
        material_name: 'Steel',
        change_type: 'Initial Stock',
        quantity_change: 600,
        resulting_quantity: 600,
        reference_type: 'Material',
        reference_id: 1,
        note: 'Initial stock entry',
        created_at: '2024-01-01T08:00:00Z',
      },
    ]);
  }),

  /**
   * PUT /materials/:id - Update material
   * Used by: Materials edit form
   */
  http.put(`${API_URL}/materials/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: params.id,
      ...body,
      message: 'Material updated successfully',
    });
  }),

  /**
   * DELETE /materials/:id - Delete material
   * Used by: Materials delete button
   */
  http.delete(`${API_URL}/materials/:id`, () => {
    return HttpResponse.json(
      { message: 'Material deleted successfully' },
      { status: 204 }           // 204 No Content
    );
  }),

  /**
   * POST /materials/reorder-scan - Trigger auto-reorder scan
   * Used by: Materials and Dashboard auto-reorder buttons
   * Returns: List of materials below minimum stock threshold
   */
  http.post(`${API_URL}/materials/reorder-scan`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Auto-reorder scan completed',
      created_requests: 1,
      data: [
        {
          id: 2,
          name: 'Copper',
          quantity: 20,
          min_stock: 50,
          required_stock: 30,
          supplier: 'Supplier B',
        },
      ],
    });
  }),

  // ========== REQUESTS ENDPOINTS ==========

  /**
   * GET /requests - Retrieve all material requests
   * Used by: Requests page
   */
  http.get(`${API_URL}/requests`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 2,
          request_id: 'REQ-002',
          job_id: 2,
          material: 'Copper',
          quantity: 30,
          status: 'Approved',    // Already approved
          requested_by: 'Jane Smith',
          requested_at: '2024-01-15T14:20:00Z',
        },
        {
          id: 1,
          request_id: 'REQ-001',
          job_id: 1,
          material: 'Steel',
          quantity: 100,
          status: 'Pending',     // Awaiting approval
          requested_by: 'John Doe',
          requested_at: '2024-01-14T10:00:00Z',
        },
      ],
    });
  }),

  /**
   * POST /requests - Create new material request
   * Used by: Requests form submission
   */
  http.post(`${API_URL}/requests`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        success: true,
        message: 'Request created',
        data: {
          id: 3,
          request_id: `REQ-${Date.now()}`,
          ...body,
          quantity: Number(body.quantity),
          status: 'Pending',    // New requests start as pending
        },
      },
      { status: 201 }
    );
  }),

  /**
   * PUT /requests/:id - Update request status
   * Used by: Requests approve/deny buttons
   * Note: Approving deducts from inventory!
   */
  http.put(`${API_URL}/requests/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: `Request ${body.status.toLowerCase()} successfully`,
      data: { id: params.id, ...body },
    });
  }),

  /**
   * DELETE /requests/:id - Delete request
   * Used by: Requests delete button
   */
  http.delete(`${API_URL}/requests/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Request deleted successfully',
    });
  }),

  // ========== REPORTS ENDPOINTS ==========

  /**
   * GET /reports/inventory-summary - Get dashboard analytics
   * Used by: Dashboard KPI cards and charts
   */
  http.get(`${API_URL}/reports/inventory-summary`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        total_materials: 3,           // Total material types
        low_stock_count: 1,           // Materials below min_stock
        pending_requests: 1,          // Awaiting approval
        approved_requests: 1,         // Approved (already deducted)
        total_inventory_value: 45000, // Dollar value of stock
      },
    });
  }),

  // ========== PURCHASE ORDERS ENDPOINTS ==========

  /**
   * GET /inv-orders - Retrieve all purchase orders
   * Used by: Orders page
   */
  http.get(`${API_URL}/inv-orders`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          order_id: 'PO-001',
          supplier_id: 1,
          material_id: 1,
          quantity: 500,           // Order quantity
          status: 'Pending',       // Awaiting delivery
          order_date: '2024-01-10',
        },
      ],
    });
  }),

  /**
   * POST /inv-orders - Create purchase order
   * Used by: Orders form submission
   */
  http.post(`${API_URL}/inv-orders`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        success: true,
        message: 'Order created',
        data: {
          id: 2,
          order_id: `PO-${Date.now()}`,
          ...body,
          status: 'Pending',      // New orders start pending
        },
      },
      { status: 201 }
    );
  }),

  /**
   * PUT /inv-orders/:id - Update order status
   * Used by: Orders status update
   * Note: Status "Delivered" auto-adds to material stock!
   */
  http.put(`${API_URL}/inv-orders/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: 'Order status updated',
      data: { id: 1, ...body },
    });
  }),

  /**
   * DELETE /inv-orders/:id - Delete order
   * Used by: Orders delete button
   */
  http.delete(`${API_URL}/inv-orders/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  }),
];
