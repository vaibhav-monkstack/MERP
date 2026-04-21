const { test, expect } = require('@playwright/test');

/**
 * INTEGRATION TEST: ORDER -> JOB -> INVENTORY
 * This test verifies the end-to-end lifecycle of a manufacturing order.
 */

test.describe('Order-to-Inventory Integration Workflow', () => {
    
    // Professional naming (Aligned with User Catalog)
    const productName = "Deadbolt Lock";
    const customerName = "Michael Corleone";
    const partName = "Euro Cylinder 70mm";

    test.beforeEach(async ({ page }) => {
        // Clear storage to ensure a clean login state
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());

        // CLEANUP: If the product template already exists, delete it for a fresh test
        console.log('Cleaning up existing test data...');
        await login(page, 'Job Manager');
        await page.goto('/jobs/templates');
        
        // Find existing template row
        const existingTemplate = page.locator('div.bg-white').filter({ hasText: productName });
        if (await existingTemplate.count() > 0) {
            console.log(`Deleting existing template: ${productName}`);
            // Click delete button (last button in card for templates)
            await existingTemplate.locator('button').last().click();
            // Handle confirmation modal if it appears
            await page.click('button:has-text("Delete")').catch(() => {}); 
        }
    });

    async function login(page, role) {
        const demoButtonMap = {
            'Job Manager':       'Job Mgr',
            'Order Manager':     'Order Mgr',
            'Inventory Manager': 'Inv Mgr',
            'Production Staff':  'Staff'
        };

        const buttonText = demoButtonMap[role];

        await page.goto('/login');
        
        // Ensure we start from a clean state (logout and clear storage)
        await page.evaluate(() => localStorage.clear());
        await page.context().clearCookies();
        await page.reload();

        // Click the demo button to auto-fill credentials and select role
        await page.click(`button:has-text("${buttonText}")`);
        
        // Wait a small moment for the form to fill
        await page.waitForTimeout(500);
        
        // Click sign in
        await page.click('button:has-text("Sign In")');
        
        await expect(page).not.toHaveURL(/\/login/);
    }

    test('Full Workflow: Create Template -> Create Order -> Init Job -> Verify Inventory', async ({ page }) => {
        
        // --- STEP 1: CREATE PRODUCT TEMPLATE (JOB MANAGER) ---
        console.log('Step 1: Creating Product Template...');
        await login(page, 'Job Manager');
        await page.goto('/jobs/templates');

        // Verify cleanup worked (should not see the product)
        await expect(page.getByRole('heading', { name: productName })).toBeHidden();

        await page.getByRole('button', { name: 'New Template' }).click();
        
        // Using placeholder because Label is not programmatically linked in HTML
        await page.getByPlaceholder('e.g. Deadbolt Lock').fill(productName);
        await page.getByPlaceholder('Short description of the product').fill('Integration test template description');
        
        // Add a part
        await page.getByRole('button', { name: 'Add Row' }).click();
        await page.getByPlaceholder('Component name').first().fill(partName);
        await page.locator('input[type="number"]').first().fill('10');
        
        // Save and wait for modal to disappear
        await page.getByRole('button', { name: 'Save Template' }).click();
        await expect(page.getByRole('heading', { name: 'New Product Template' })).toBeHidden();
        
        // Verify the template appears in the dashboard list
        await expect(page.getByRole('heading', { name: productName })).toBeVisible();

        // --- STEP 2: CREATE ORDER (ORDER MANAGER) ---
        console.log('Step 2: Creating Order...');
        await login(page, 'Order Manager');
        await page.goto('/orders/new');
        
        // Customer Info
        await page.locator('label:has-text("Full Name")').locator('..').locator('input').fill(customerName);
        await page.locator('label:has-text("Email")').locator('..').locator('input').fill(`michael@corleone.com`);
        await page.locator('label:has-text("Delivery Address")').locator('..').locator('textarea, input').first().fill('123 Integration St');
        
        // Product Info
        // Use the dropdown to select the template we just created
        await page.locator('select').filter({ hasText: 'Select a Product Template' }).selectOption(productName);
        
        // Date Pickers
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Click the calendar icon (symbol) and then fill the date
        const orderDateInput = page.locator('label:has-text("Order Date")').locator('..').locator('input');
        await orderDateInput.locator('..').locator('svg').first().click(); 
        await orderDateInput.fill(tomorrowStr);

        const deadlineInput = page.locator('label:has-text("Production Deadline")').locator('..').locator('input');
        await deadlineInput.locator('..').locator('svg').first().click();
        await deadlineInput.fill(tomorrowStr);
        
        // Quantity and Price
        await page.locator('label:has-text("Quantity")').locator('..').locator('input').fill('5');
        await page.locator('label:has-text("Unit Price")').locator('..').locator('input').fill('1000');
        
        await page.click('button:has-text("Save Order")');
        await expect(page).toHaveURL(/\/orders/);
        
        // --- STEP 3: CONFIRM ORDER ---
        console.log('Step 3: Confirming Order...');
        const orderRow = page.locator(`tr:has-text("${customerName}")`).first();
        const statusSelect = orderRow.locator('select');
        await statusSelect.selectOption('confirmed');
        // Wait for status sync (may take a second for background logic)
        await page.waitForTimeout(2000); 

        // --- STEP 4: APPROVE JOB (JOB MANAGER) ---
        console.log('Step 4: Approving Auto-Generated Job...');
        await login(page, 'Job Manager');
        await page.goto('/jobs');
        
        // Locate the auto-generated job card and approve it
        const approvalCard = page.locator('.bg-white').filter({ hasText: `ID #JOB-` }).filter({ hasText: productName }).first();
        await expect(approvalCard).toBeVisible({ timeout: 20000 });
        await approvalCard.locator('button:has-text("Approve Plan")').click();
        
        // --- STEP 6: VERIFY INVENTORY (INVENTORY MANAGER) ---
        console.log('Step 6: Verifying Inventory Requests...');
        await login(page, 'Inventory Manager');
        await page.goto('/inventory/requests');
        
        // Verify that the material request for our part exists
        const requestRow = page.locator(`tr:has-text("${partName}")`).first();
        await expect(requestRow).toBeVisible({ timeout: 15000 });
        
        console.log('✅ End-to-End Integration Test Passed');
    });

});
