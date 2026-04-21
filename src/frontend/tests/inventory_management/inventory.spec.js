import { test, expect } from '@playwright/test';

test.describe('Inventory Management E2E Workflow', () => {
  const BASE_URL = 'http://localhost:5173';

  test('Complete Inventory Manager Day-to-Day Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Navigation and Login
    await page.goto(`${BASE_URL}/login`);
    
    // Fill credentials manually to test realistic user inputs
    await page.getByPlaceholder('your.email@factory.com').fill('inventory@factory.com');
    await page.getByPlaceholder('••••••••').fill('inventory123');
    
    // Because the "role" is an uncontrolled UI dropdown that doesn't affect auth,
    // we just directly submit the form.
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Wait for redirect and ensure RBAC loads the Dashboard
    await page.waitForURL('**/inventory**');
    
    // Expect the top header of the inventory to be visible
    await expect(page.getByRole('heading', { name: /Inventory Overview/i })).toBeVisible();

    // Verify stats cards loaded (checking the text of at least one card)
    await expect(page.getByText('Total Materials').first()).toBeVisible();

    // 3. Move to Materials view
    // Using the Unified Navbar navigation
    await page.getByRole('link', { name: 'Materials' }).click();
    
    // Wait to land on the Materials component
    await expect(page.getByRole('heading', { name: /Material Management/i, exact: false })).toBeVisible();

    // 4. Add a New Material Payload
    // Use a unique name so that simultaneous browser workers don't clash in the database
    const testMaterialName = `Playwright Test ${Date.now()}`;

    await page.getByRole('button', { name: /Add Material/i }).click();

    // Wait for Modal to open
    const modalHeading = page.getByRole('heading', { name: 'Add Material' });
    await expect(modalHeading).toBeVisible();

    // Fill form by placeholders
    await page.getByPlaceholder('Material name').fill(testMaterialName);
    await page.getByPlaceholder('Material type').fill('Automated Test Metal');
    await page.getByPlaceholder('0').fill('500'); // Quantity
    await page.getByPlaceholder('Min stock threshold').fill('100'); // Min Stock
    await page.getByPlaceholder('Supplier name').fill('Playwright Corp');

    // Submit form (Save button)
    await page.getByRole('button', { name: 'Save' }).click();

    // Ensure the modal closes
    await expect(modalHeading).toBeHidden();

    // 5. Verify Insertion in Data Table
    // Use the dynamic name to find our specific test row
    const newRow = page.locator('tr').filter({ hasText: testMaterialName }).first();
    await expect(newRow).toBeVisible();

    // 6. Data Cleanup
    const deleteButton = newRow.getByRole('button').nth(1);
    
    // Auto-accept the browser confirmation prompt before clicking
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await deleteButton.click();

    // Ensure the row fully disappears upon deletion sync
    await expect(newRow).toBeHidden();
  });

  test('Inventory Module Sanity Sweep - Verify all sub-pages load', async ({ page }) => {
    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('your.email@factory.com').fill('inventory@factory.com');
    await page.getByPlaceholder('••••••••').fill('inventory123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/inventory**');

    // 2. Dashboards & Tables Sanity Check
    
    // Check Materials
    await page.getByRole('link', { name: 'Materials', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Material Management' })).toBeVisible();

    // Check Requests
    await page.getByRole('link', { name: 'Requests', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Material Requests' })).toBeVisible();

    // Check Suppliers
    await page.getByRole('link', { name: 'Suppliers', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Supplier Management' })).toBeVisible();

    // Check Analytics
    await page.getByRole('link', { name: 'Analytics', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Inventory Analytics' })).toBeVisible();

    // Check Stock Log / Movements
    await page.getByRole('link', { name: 'Stock Log', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Stock Movement Log' })).toBeVisible();

    // Check Procurement Orders
    // We might need to handle navigation carefully if it's a sub-menu
    await page.goto(`${BASE_URL}/inventory/orders`);
    await expect(page.getByRole('heading', { name: 'Inventory Orders' })).toBeVisible();

    // Check New Purchase Order form
    await page.getByRole('button', { name: /Place New Order/i, exact: false }).or(page.getByRole('link', { name: /New Order/i })).first().click();
    await expect(page.getByRole('heading', { name: 'Place Purchase Order' })).toBeVisible();
  });

  test('Functional: Create and Verify Material Request', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('your.email@factory.com').fill('inventory@factory.com');
    await page.getByPlaceholder('••••••••').fill('inventory123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/inventory**');

    // 1. Navigate to Requests
    await page.getByRole('link', { name: 'Requests', exact: true }).click();
    
    // 2. Fill out Request Form
    const testJobId = `JOB-TEST-${Date.now()}`;
    await page.locator('input#job-id-input').fill(testJobId);
    
    // Target the select by its unique ID and tag name (ultimate specificity)
    await page.waitForSelector('select#material-select', { state: 'attached' });
    await expect(page.locator('select#material-select option').nth(1)).toBeAttached({ timeout: 15000 });
    await page.locator('select#material-select').selectOption({ index: 1 });

    await page.locator('input#quantity-input').fill('1');
    await page.locator('input#requester-input').fill('Playwright Bot');

    // 3. Handle the Alert and Submit
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.getByRole('button', { name: 'Submit Request' }).click();

    // 4. Verify in Table
    // The table shows the Job ID in a Badge or Ref column
    await expect(page.locator('td').filter({ hasText: testJobId.split('-').pop() }).first()).toBeVisible();
  });

  test('Functional: Add and Verify New Supplier', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('your.email@factory.com').fill('inventory@factory.com');
    await page.getByPlaceholder('••••••••').fill('inventory123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/inventory**');

    // 1. Navigate to Suppliers
    await page.getByRole('link', { name: 'Suppliers', exact: true }).click();
    
    // 2. Open Modal
    await page.getByRole('button', { name: 'Add Supplier' }).click();
    
    // 3. Fill Form
    const supplierName = `Test Supplier ${Date.now()}`;
    await page.getByPlaceholder('Supplier name').fill(supplierName);
    await page.getByPlaceholder('email@example.com').fill('test@playwright.com');
    await page.getByPlaceholder('City, State').fill('Test City, TC');
    await page.getByPlaceholder('0-5').fill('5');
    
    // 4. Save
    await page.getByRole('button', { name: 'Save' }).click();
    
    // 5. Verify Visibility of the new Supplier Card
    await expect(page.getByText(supplierName).first()).toBeVisible();
  });

  test('Functional: Place and Verify Procurement Order', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('your.email@factory.com').fill('inventory@factory.com');
    await page.getByPlaceholder('••••••••').fill('inventory123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/inventory**');

    // 1. Navigate to New Order
    await page.goto(`${BASE_URL}/inventory/orders/new`);
    
    // 2. Fill Order Details
    // Select by matching the specific placeholder options within each select
    const supplierSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Select a supplier...' }) });
    const materialSelect = page.locator('select').filter({ has: page.locator('option', { hasText: /Select material/i }) });
    
    await expect(supplierSelect.locator('option').nth(1)).toBeAttached({ timeout: 15000 });
    await supplierSelect.selectOption({ index: 1 });
    
    await expect(materialSelect.locator('option').nth(1)).toBeAttached({ timeout: 15000 });
    await materialSelect.selectOption({ index: 1 });
    
    await page.getByPlaceholder('Enter amount').fill('10');
    
    // 3. Submit
    await page.getByRole('button', { name: 'Confirm & Place Order' }).click();
    
    // 4. Verify Redirection and Table Entry
    await page.waitForURL('**/inventory/orders');
    await expect(page.getByRole('heading', { name: 'Inventory Orders' })).toBeVisible();
    
    // Check for the 'Pending' status in the table (targeting td to avoid hidden select options)
    await expect(page.locator('td').filter({ hasText: 'Pending' }).first()).toBeVisible();
  });
});
