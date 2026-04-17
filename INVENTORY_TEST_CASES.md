# Inventory Management System - Test Cases

## TABLE OF CONTENTS
1. [Backend Unit Tests](#backend-unit-tests)
2. [Backend Integration Tests](#backend-integration-tests)
3. [Frontend Component Tests](#frontend-component-tests)
4. [Frontend Integration Tests](#frontend-integration-tests)
5. [End-to-End Scenarios](#end-to-end-scenarios)

---

## BACKEND UNIT TESTS

### Materials Controller Tests

#### Test Suite 1: Get Materials
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-001 | Get all materials successfully | 1. Call getMaterials() with DB containing 5 materials | Returns array of 5 materials with all fields (id, name, quantity, min_stock, price) | P1 |
| BC-002 | Get materials from empty DB | 1. Call getMaterials() with empty DB | Returns empty array [] | P2 |
| BC-003 | Get materials includes low stock flag | 1. Call getMaterials() with material qty=2, min_stock=5 | Material object includes lowStock: true flag | P2 |

#### Test Suite 2: Add Material
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-004 | Add new material successfully | 1. Call addMaterial({name: "Steel", qty: 100, min_stock: 20}) | Material created with ID, quantity=100, min_stock=20 | P1 |
| BC-005 | Add material triggers auto-deduplication | 1. Material "Steel" exists with qty=50; 2. Add duplicate "Steel" with qty=30 | Original material qty updated to 80, no duplicate created | P1 |
| BC-006 | Add material below min_stock triggers reorder | 1. Add material {qty: 5, min_stock: 20}; 2. Verify auto-request created | Auto request created with quantity=(20*2-5)=35 | P1 |
| BC-007 | Add material without required fields | 1. Call addMaterial({name: "Steel"}) missing qty, min_stock | Returns 400 error with message "Required fields missing" | P1 |
| BC-008 | Add material with negative quantity | 1. Call addMaterial({qty: -10}) | Returns 400 error "Quantity must be positive" | P1 |

#### Test Suite 3: Update Material
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-009 | Update material quantity | 1. Material exists with qty=100; 2. Call updateMaterial(id, {qty: 80}) | Quantity updated to 80 | P1 |
| BC-010 | Update creates stock movement record | 1. Update material qty 100→80; 2. Check stock_movements table | Movement entry created: type="Adjustment", qty_change=-20 | P1 |
| BC-011 | Update material price | 1. Call updateMaterial(id, {price: 150}) | Price updated to 150 | P2 |
| BC-012 | Update material triggers reorder if qty drops below min_stock | 1. Material qty=30; 2. Update qty to 5, min_stock=20 | Auto reorder request created | P1 |
| BC-013 | Update non-existent material | 1. Call updateMaterial(999, {qty: 50}) | Returns 404 error "Material not found" | P1 |

#### Test Suite 4: Delete Material
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-014 | Delete material successfully | 1. Material exists; 2. Call deleteMaterial(id) | Material removed from DB | P1 |
| BC-015 | Delete material with pending requests | 1. Material has approved request pending; 2. Delete material | Returns 400 error "Cannot delete material with active requests" | P1 |
| BC-016 | Delete non-existent material | 1. Call deleteMaterial(999) | Returns 404 error | P2 |
| BC-017 | Delete creates stock movement record | 1. Delete material with qty=100; 2. Check stock_movements | Movement entry: type="Deletion", qty_change=-100 | P2 |

#### Test Suite 5: Reorder Scan
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-018 | Reorder scan identifies low stock materials | 1. DB has 3 materials: qty=[50,5,25] with min_stock=[20,20,20]; 2. Call reorderScan() | Auto requests created for materials with qty<min_stock (2 requests) | P1 |
| BC-019 | Reorder scan calculates correct request quantity | 1. Material: qty=5, min_stock=20; 2. Run reorderScan() | Request quantity = max(20*2-5, 20) = 35 | P1 |
| BC-020 | Reorder scan skips existing pending requests | 1. Material qty=5, existing pending request; 2. Run reorderScan() | No duplicate request created | P1 |
| BC-021 | Reorder scan on all materials | 1. 10 materials in DB; 2. Call reorderScan() | Batch processes all materials efficiently | P2 |

---

### Stock Controller Tests

#### Test Suite 6: Record Stock Movement
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-022 | Record movement with all fields | 1. Call recordStockMovement({material_id: 1, change_type: "Adjustment", qty_change: 50, result_qty: 150, reference: "REQ-1"}) | Movement logged with timestamp, all fields captured | P1 |
| BC-023 | Record movement validates quantity fields | 1. Call recordStockMovement({qty_change: "invalid"}) | Returns 400 error "Quantity must be numeric" | P1 |
| BC-024 | Record movement with negative quantity | 1. Call recordStockMovement({qty_change: -50, result_qty: 50}) | Movement recorded correctly (deduction case) | P1 |
| BC-025 | Movement record includes timestamp | 1. Record movement; 2. Check created_at field | Timestamp automatically set to current time | P1 |

#### Test Suite 7: Get Stock Movements
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-026 | Get movements for specific material | 1. Material 1 has 5 movements; Material 2 has 3; 2. GetStockMovements(material_id=1) | Returns 5 movements for material 1 only | P1 |
| BC-027 | Movements ordered by date DESC | 1. Log movements at times: 9:00, 9:05, 9:10; 2. GetStockMovements() | Returns in order: 9:10, 9:05, 9:00 | P1 |
| BC-028 | Get movements with changes summary | 1. Movements: +50, -20, +100; 2. GetStockMovements() | Each includes running balance (50, 30, 130) | P2 |
| BC-029 | Get movements on empty material | 1. New material with no history; 2. GetStockMovements(material_id) | Returns empty array | P2 |

---

### Requests Controller Tests

#### Test Suite 8: Get Requests
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-030 | Get all requests | 1. DB has 4 requests; 2. Call getRequests() | Returns all 4 requests with status fields | P1 |
| BC-031 | Get requests returns status breakdown | 1. Requests: 2 Pending, 1 Approved, 1 Denied; 2. Call getRequests() | All statuses represented in response | P2 |
| BC-032 | Get requests includes material details | 1. Request references material ID 5; 2. Call getRequests() | Response includes material name, qty_requested, material.available_qty | P2 |

#### Test Suite 9: Add Request
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-033 | Create request successfully | 1. Material exists with qty=100; 2. Call addRequest({material_id: 1, qty: 50}) | Request created with status="Pending" | P1 |
| BC-034 | Create request validates available inventory | 1. Material qty=30; 2. Try addRequest({material_id: 1, qty: 50}) | Returns 400 error "Insufficient inventory. Available: 30" | P1 |
| BC-035 | Create request with exact available qty | 1. Material qty=50; 2. addRequest({material_id: 1, qty: 50}) | Request created successfully (edge case) | P1 |
| BC-036 | Create request generates unique ID | 1. Create 3 requests; 2. Check ID pattern | Each has unique ID (REQ-XXXX pattern) | P2 |
| BC-037 | Create request without material | 1. Call addRequest({qty: 50}) missing material_id | Returns 400 error "Material ID required" | P1 |

#### Test Suite 10: Update Request Status
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-038 | Approve request deducts inventory | 1. Material qty=100, Request qty=30, status=Pending; 2. updateRequestStatus(id, "Approved") | Material qty becomes 70, movement logged | P1 |
| BC-039 | Approve request triggers reorder if needed | 1. After deduction, material qty=5 (min_stock=20); 2. Approve request; 3. Check auto request | Reorder auto-request created | P1 |
| BC-040 | Deny request doesn't deduct inventory | 1. Material qty=100, Request qty=30; 2. updateRequestStatus(id, "Denied") | Material qty stays 100 | P1 |
| BC-041 | Update request prevents double deduction | 1. Approve request (qty-30); 2. Try approve again | Returns error "Request already approved" | P1 |
| BC-042 | Update request with invalid status | 1. Call updateRequestStatus(id, "Invalid") | Returns 400 error "Invalid status value" | P1 |
| BC-043 | Update non-existent request | 1. Call updateRequestStatus(999, "Approved") | Returns 404 error | P1 |

#### Test Suite 11: Delete Request
| Test ID | Test Name | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BC-044 | Delete pending request | 1. Request status=Pending; 2. Call deleteRequest(id) | Request removed, no stock movement | P1 |
| BC-045 | Delete approved request restores inventory | 1. Request status=Approved (already deducted 50); 2. deleteRequest(id) | Inventory restored (+50), movement logged | P1 |
| BC-046 | Delete non-existent request | 1. Call deleteRequest(999) | Returns 404 error | P2 |

---

## BACKEND INTEGRATION TESTS

### API Endpoint Tests

#### Test Suite 12: Materials API Integration
| Test ID | Test Name | Setup | Request | Expected Response | Priority |
|---------|-----------|-------|---------|-------------------|----------|
| API-001 | GET /materials | 5 materials in DB | GET /materials | 200, returns array with 5 items | P1 |
| API-002 | POST /materials | Empty materials | POST {name:"Steel", qty:100, min_stock:20} | 201, returns created material with ID | P1 |
| API-003 | POST /materials/reorder-scan | 3 low-stock materials | POST /materials/reorder-scan | 200, returns {created_requests: 3} | P1 |
| API-004 | PUT /materials/:id | Material exists | PUT {qty: 80} | 200, returns updated material | P1 |
| API-005 | DELETE /materials/:id | Material exists | DELETE /materials/1 | 204 No Content | P1 |
| API-006 | GET /materials/movements | 10 movements logged | GET /materials/movements | 200, returns movements array DESC ordered | P1 |

#### Test Suite 13: Requests API Integration
| Test ID | Test Name | Setup | Request | Expected Response | Priority |
|---------|-----------|-------|---------|-------------------|----------|
| API-007 | GET /requests | 4 requests in DB | GET /requests | 200, returns array | P1 |
| API-008 | POST /requests | Material qty=100 exists | POST {material_id:1, qty:50} | 201, returns created request | P1 |
| API-009 | POST /requests insufficient stock | Material qty=30 | POST {material_id:1, qty:50} | 400, error message with available qty | P1 |
| API-010 | PUT /requests/:id/status | Pending request exists | PUT {status:"Approved"} | 200, material qty deducted | P1 |
| API-011 | DELETE /requests/:id | Request exists | DELETE /requests/1 | 204 No Content | P1 |

#### Test Suite 14: Purchase Orders API Integration
| Test ID | Test Name | Setup | Request | Expected Response | Priority |
|---------|-----------|-------|---------|-------------------|----------|
| API-012 | GET /inv-orders | 3 orders in DB | GET /inv-orders | 200, returns orders array | P1 |
| API-013 | POST /inv-orders | Supplier & material exist | POST {supplier_id:1, material_id:1, quantity:500} | 201, returns order with ID | P1 |
| API-014 | PUT /inv-orders/:id/status | Order status=Pending | PUT {status:"Delivered"} | 200, material qty increased | P1 |
| API-015 | PUT order to Delivered auto-restocks | Order qty=500, material=100 | PUT {status:"Delivered"} | Material qty becomes 600, movement logged | P1 |

#### Test Suite 15: Reports API Integration
| Test ID | Test Name | Setup | Request | Expected Response | Priority |
|---------|-----------|-------|---------|-------------------|----------|
| API-016 | GET /reports/inventory-summary | Mixed inventory state | GET /reports/inventory-summary | 200, returns {low_stock_count, total_materials, pending_requests} | P1 |
| API-017 | Low stock count accuracy | 3 materials qty < min_stock | GET /reports/inventory-summary | low_stock_count = 3 | P1 |

---

#### Test Suite 16: Cross-Module Integration Flows
| Test ID | Test Name | Scenario | Steps | Expected Result | Priority |
|---------|-----------|----------|-------|-----------------|----------|
| INT-001 | Complete Order-to-Stock Flow | Purchase order received | 1. POST /inv-orders (qty=500); 2. PUT status="Delivered"; 3. GET /materials (check qty) | Material qty +500, movement recorded | P1 |
| INT-002 | Complete Request-to-Stock Flow | Material requested | 1. POST /requests (qty=100); 2. PUT status="Approved"; 3. GET /materials; 4. Check movement log | Material qty -100, movement logged, possible auto-reorder triggered | P1 |
| INT-003 | Auto-Reorder Chain | Threshold triggered | 1. Material qty=10, min_stock=20; 2. POST /requests (qty=30); 3. Approve; 4. Check auto requests | Reorder request auto-created | P1 |
| INT-004 | Database Consistency | Multiple operations | 1. Add material; 2. Create order; 3. Deliver order; 4. Create request; 5. Approve | All stock_movements recorded, balances match in all tables | P1 |

---

## FRONTEND COMPONENT TESTS

### Dashboard Component Tests

#### Test Suite 17: Materials Dashboard
| Test ID | Test Name | Setup | Action | Expected Result | Priority |
|---------|-----------|-------|--------|-----------------|----------|
| FE-001 | Dashboard loads successfully | Mock API returns summary data | Render Dashboard component | Dashboard visible with all KPI cards | P1 |
| FE-002 | Display low stock count KPI | Summary: low_stock_count=5 | Render dashboard | KPI card shows "5 Low Stock Materials" | P1 |
| FE-003 | Display pending requests KPI | Summary: pending_requests=3 | Render dashboard | KPI card shows "3 Pending Requests" | P2 |
| FE-004 | Stock level chart renders | Mock materials: [{name:"Steel",qty:100},{name:"Copper",qty:50}] | Render dashboard | Bar chart displays with 2 bars | P1 |
| FE-005 | Auto-reorder scan button triggers | User clicks "Run Reorder Scan" | Click button | API call to POST /materials/reorder-scan made | P1 |
| FE-006 | Dashboard handles API error | API returns 500 error | Render dashboard | Error message displayed, no crash | P2 |
| FE-007 | Dashboard loader displays | API slow (2s delay) | Render | Loading spinner shown until data arrives | P2 |

#### Test Suite 18: Materials List Component
| Test ID | Test Name | Setup | Action | Expected Result | Priority |
|---------|-----------|-------|--------|-----------------|----------|
| FE-008 | Materials table displays | API returns 5 materials | Render Materials.jsx | Table shows 5 rows with columns: Name, Qty, Min Stock, Price | P1 |
| FE-009 | Search materials by name | Table has: Steel, Copper, Aluminum; User types "Steel" | Type in search | Table filtered to show only Steel | P1 |
| FE-010 | Filter low stock materials | 3 materials below min_stock | Click "Low Stock Filter" | Table shows only 3 low-stock items | P1 |
| FE-011 | Add material form | User fills form | Submit form | POST /materials called with form data | P1 |
| FE-012 | Edit material inline | Material qty=100; User clicks edit, changes to 80 | Update & submit | PUT /materials/:id called | P2 |
| FE-013 | Delete material confirmation | User clicks delete button | Confirm deletion | DELETE /materials/:id called, row removed | P1 |
| FE-014 | Material quantity validation | User enters qty=-50 | Try submit | Form error "Quantity must be positive" | P1 |
| FE-015 | Duplicate material detection | Steel exists; User adds Steel again | Submit form | Toast: "Material auto-deduplicated, quantity updated" | P2 |

#### Test Suite 19: Requests Component
| Test ID | Test Name | Setup | Action | Expected Result | Priority |
|---------|-----------|-------|--------|-----------------|----------|
| FE-016 | Requests table displays | 4 requests in DB | Render Requests.jsx | Table shows 4 rows with columns: ID, Material, Qty, Status | P1 |
| FE-017 | Filter requests by status | 2 Pending, 1 Approved, 1 Denied | Filter by "Approved" | Table shows 1 row | P1 |
| FE-018 | Approve request button | Pending request displayed | Click "Approve" | PUT /requests/:id/status="Approved" called | P1 |
| FE-019 | Deny request button | Pending request displayed | Click "Deny" | PUT /requests/:id/status="Denied" called | P1 |
| FE-020 | Bulk update status | 3 pending requests; User selects all | Click "Approve All" | All 3 status updated to Approved | P2 |
| FE-021 | Delete request | Request displayed | Click delete | DELETE /requests/:id called | P1 |
| FE-022 | Request form validates material qty | Material available qty=50; User requests 100 | Try create request | Error: "Only 50 qty available" | P1 |
| FE-023 | Request creation triggers confirmation | User creates request | Submit form | Toast: "Request created" + material qty updated in UI | P2 |

#### Test Suite 20: Stock Movement Log
| Test ID | Test Name | Setup | Action | Expected Result | Priority |
|---------|-----------|-------|--------|-----------------|----------|
| FE-024 | Movement log displays audit trail | Material has 10 movements | Render MovementLog.jsx | Table shows all 10 movements DESC ordered | P1 |
| FE-025 | Movement shows all fields | Movement entry | Display row | Shows: Date, Type, Qty Change, Balance, Reference | P1 |
| FE-026 | Movement table pagination | 50 movements in DB | Page 1 | Shows 20 items, pagination controls visible | P2 |
| FE-027 | Filter movements by type | Movements: 5 Purchase, 3 Request, 2 Adjustment | Filter "Purchase" | Shows 5 rows | P2 |

#### Test Suite 21: Purchase Orders Component
| Test ID | Test Name | Setup | Action | Expected Result | Priority |
|---------|-----------|-------|--------|-----------------|----------|
| FE-028 | Orders table displays | 3 purchase orders in DB | Render Orders.jsx | Table shows 3 rows: ID, Supplier, Material, Qty, Status | P1 |
| FE-029 | Create new order form | Suppliers and materials available | Click "New Order" | Form opens with dropdowns for supplier/material | P1 |
| FE-030 | Update order status | Order status=Pending | Change to "Delivered" | PUT /inv-orders/:id called, material qty increases | P1 |
| FE-031 | Delete order | Order exists | Click delete | DELETE /inv-orders/:id called | P1 |
| FE-032 | Order ID auto-generates | New order created | Submit form | Order ID in pattern PO-XXXX displayed | P2 |

---

## FRONTEND INTEGRATION TESTS

#### Test Suite 22: User Workflows
| Test ID | Test Name | Scenario | Steps | Expected UI Changes | Priority |
|---------|-----------|----------|-------|-------------------|----------|
| WF-001 | Low Stock Alert to Reorder | Material drops below min_stock | 1. Dashboard shows low stock; 2. Click "Run Reorder Scan"; 3. Check Requests page | Dashboard KPI updates, new request appears in Requests list | P1 |
| WF-002 | Create & Approve Request | Staff requests materials | 1. Navigate to Requests; 2. Click New; 3. Select material qty=50; 4. Approve | Material qty decreases, movement logged in audit trail | P1 |
| WF-003 | Receive Purchase Order | Supplier delivers | 1. Orders page, pending order; 2. Mark "Delivered"; 3. Check Materials page | Material qty increases, order status changes | P1 |
| WF-004 | Real-time Inventory Updates | Multiple operations | 1. Update material; 2. Approve request; 3. Deliver order | Dashboard KPIs update without reload | P2 |
| WF-005 | Audit Trail Completeness | Trace material changes | 1. Create material qty=1000; 2. Approve request -500; 3. Deliver order +300; 4. View audit log | 4 movements recorded: Creation, Request, Delivery, (optional reorder) | P1 |

---

## END-TO-END SCENARIOS

#### Test Suite 23: Complete Business Scenarios
| Test ID | Test Name | Full Scenario | Success Criteria | Priority |
|---------|-----------|---------------|--------------------|----------|
| E2E-001 | New Material Intake | 1. Supplier delivers Steel (1000 qty); 2. Create PO; 3. Mark delivered; 4. Dashboard updates | Dashboard shows material, movement log records delivery, qty=1000 correct | P1 |
| E2E-002 | Material Shortage Alert | 1. Steel qty=100, min_stock=200; 2. Run reorder scan; 3. Auto request created; 4. Approve request; 5. Check qty | Reorder quantity calculated correctly, material deducted, new reorder auto-triggered | P1 |
| E2E-003 | Production Job Uses Materials | 1. Job requires 50 Steel + 30 Copper; 2. Create request; 3. Approve; 4. Check audit | Both materials deducted, 2 movements logged, reorders trigger if needed | P1 |
| E2E-004 | Low Stock Prevention | 1. Material at 15 qty, min=20; 2. Dashboard alerts; 3. Create PO 500 qty; 4. Deliver; 5. Check result | Auto reorder prevented after delivery, qty=515, dashboard updated | P1 |
| E2E-005 | Data Integrity After Failed Transaction | 1. Approve request (fail halfway); 2. Retry; 3. Check DB consistency | No duplicate deductions, audit trail clear, qty correct | P2 |
| E2E-006 | Multi-User Concurrent Requests | 1. User A & B approve same material simultaneously; 2. Check results | Both deductions applied sequentially, no data loss, audit trail clear | P2 |
| E2E-007 | Month-End Inventory Reconciliation | 1. Run analytics; 2. Generate summary report; 3. Verify against audit trail | Report accurate, low stock alerts current, no discrepancies | P2 |

---

## TESTING DEPENDENCIES & FIXTURES

### Mock Data Requirements

**Materials:**
```json
{
  "material_1": { "id": 1, "name": "Steel", "quantity": 500, "min_stock": 100, "price": 50 },
  "material_2": { "id": 2, "name": "Copper", "quantity": 20, "min_stock": 50, "price": 75 },
  "material_3": { "id": 3, "name": "Aluminum", "quantity": 300, "min_stock": 150, "price": 40 }
}
```

**Requests:**
```json
{
  "request_1": { "id": "REQ-001", "material_id": 1, "qty": 100, "status": "Pending" },
  "request_2": { "id": "REQ-002", "material_id": 2, "qty": 30, "status": "Approved" }
}
```

**Purchase Orders:**
```json
{
  "order_1": { "id": "PO-001", "supplier_id": 1, "material_id": 1, "quantity": 500, "status": "Pending" }
}
```

### Testing Tools Required
- **Backend:** Jest, Supertest, sqlite3 (or your DB)
- **Frontend:** React Testing Library, Vitest/Jest, Mock Service Worker (MSW)
- **E2E:** Cypress or Playwright

---

## TEST EXECUTION STRATEGY

### Phase 1: Backend Unit Tests (Week 1)
- Controllers: Materials, Stock, Requests
- Coverage Target: 85%+

### Phase 2: Backend Integration Tests (Week 2)
- API endpoints with DB
- Cross-module workflows

### Phase 3: Frontend Component Tests (Week 2-3)
- Individual pages and components
- User interactions

### Phase 4: Frontend Integration Tests (Week 3)
- Multi-component workflows
- API mocking with MSW

### Phase 5: End-to-End Tests (Week 4)
- Complete user scenarios
- Both frontend and backend together
