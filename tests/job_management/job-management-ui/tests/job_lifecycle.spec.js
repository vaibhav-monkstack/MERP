const { test, expect } = require('@playwright/test');

test.describe('Job Management Lifecycle', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@factory.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.selectOption('select', 'Job Manager');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test('should complete a full job lifecycle: create, search, and track', async ({ page }) => {
    const productName = `LifecycleTest-${Date.now()}`;
    
    // 1. CREATE JOB
    await page.click('button:has-text("Create New Job")');
    await page.fill('#product', productName);
    await page.fill('#quantity', '45');
    const teamSelect = page.locator('#team');
    await expect(teamSelect).toBeVisible({ timeout: 10000 });
    await teamSelect.selectOption('Default Production Team');
    await page.selectOption('#priority', 'High');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('#deadline', tomorrow.toISOString().split('T')[0]);
    
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/jobs') && r.request().method() === 'POST'),
        page.click('button:has-text("Create Job")')
    ]);
    
    await expect(page).toHaveURL(/\/jobs$/);
    
    // 2. SEARCH & VERIFY
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    await page.fill('input[placeholder="Search products, teams, or IDs..."]', productName);
    const jobRow = page.locator(`tr:has-text("${productName}")`);
    await expect(jobRow).toBeVisible({ timeout: 15000 });
    
    // 3. NAVIGATE TO TRACKING & UPDATE
    await jobRow.click();
    await expect(page).toHaveURL(/\/jobs\/[A-Z0-9-]+$/);
    
    const stageSelect = page.locator('select').first();
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/jobs/')),
        stageSelect.selectOption('Materials Ready')
    ]);
    
    await expect(stageSelect).toHaveValue('Materials Ready');
    console.log('✅ Job Lifecycle Test Passed');
  });
});
