const { test, expect } = require('@playwright/test');

test.describe('Admin & Exception Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@factory.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.selectOption('select', 'Job Manager');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test('should manage teams and handle rework flow', async ({ page }) => {
    const workerName = `AutoWorker-${Date.now()}`;
    const teamName = `AutoTeam-${Date.now()}`;
    const jobName = `ReworkTest-${Date.now()}`;
    
    // --- 1. ADMIN ACTIONS ---
    console.log('Step 1: Managing Teams and Workers');
    await page.goto('/jobs/teams', { waitUntil: 'networkidle' });
    
    // Capture initial team count
    const initialTeamsText = await page.getByTestId('stats-teams-count').textContent();
    const initialCount = parseInt(initialTeamsText) || 0;
    console.log(`Initial team count: ${initialCount}`);

    // Create Worker
    await page.click('button:has-text("New Worker Account")');
    await page.fill('input[placeholder="e.g. Alex Kumar"]', workerName);
    await page.fill('input[placeholder="e.g. alex@factory.com"]', `auto_${Date.now()}@factory.com`);
    await page.fill('input[placeholder="At least 6 characters"]', 'pass123');
    await page.click('button:has-text("Create Worker")');
    await page.waitForTimeout(1000); // UI stabilization
    
    // Create Team
    await page.click('button:has-text("New Team")');
    await page.fill('input[placeholder="e.g. Team Epsilon"]', teamName);
    
    const teamPostRequest = page.waitForResponse(r => r.url().includes('/api/teams') && r.request().method() === 'POST');
    await page.click('button:has-text("Create Team")');
    await teamPostRequest;
    console.log(`Team POST successful. Waiting for DB commit...`);
    await page.waitForTimeout(3000); // 3s DB commit buffer
    
    // DIRECT SYNC: Instead of relying on the UI search filter, we target the card directly
    console.log(`Locating team card directly: ${teamName}`);
    
    // We reload once to guarantee the backend data is in the DOM
    await page.reload({ waitUntil: 'networkidle' });
    
    // Target the card directly by its data-testid or text
    const teamCard = page.locator('.team-card', { hasText: teamName }).first();
    await expect(teamCard).toBeVisible({ timeout: 20000 });
    
    // ADD MEMBER IN MODAL
    console.log('Adding worker to team');
    await teamCard.getByTestId('add-member-box').click();
    const workerRow = page.getByTestId(`worker-row-${workerName}`);
    await expect(workerRow).toBeVisible({ timeout: 15000 });
    await workerRow.getByTestId('add-specific-worker-btn').click();
    await page.click('button:has-text("Close")');
    
    // --- 2. EXCEPTION: REWORK FLOW ---
    console.log('Step 2: Testing Rework Flow');
    await page.goto('/jobs/new', { waitUntil: 'networkidle' });
    await page.fill('#product', jobName);
    await page.fill('#quantity', '10');
    await page.waitForTimeout(2000); 
    await page.selectOption('#team', teamName); 
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('#deadline', tomorrow.toISOString().split('T')[0]);
    await page.click('button:has-text("Create Job")');
    
    await expect(page).toHaveURL(/\/jobs$/);
    await page.fill('input[placeholder="Search products, teams, or IDs..."]', jobName);
    const trackingRow = page.locator(`tr:has-text("${jobName}")`);
    await expect(trackingRow).toBeVisible();
    await trackingRow.click();
    
    await page.locator('select').first().selectOption('Quality Check');
    await page.click('button:has-text("Quality Check")');
    
    const boxes = page.locator('button.w-6.h-6.rounded.border-2');
    await expect(boxes.first()).toBeVisible();
    await boxes.nth(0).click();
    await boxes.nth(1).click();
    
    await page.fill('textarea[placeholder="Describe what needs to be fixed..."]', 'Defect detected.');
    await page.selectOption('select.w-full', teamName); 
    await page.click('button:has-text("Submit for Rework")');
    
    await expect(page).toHaveURL(/\/jobs$/);
    await page.fill('input[placeholder="Search products, teams, or IDs..."]', jobName);
    await expect(page.locator(`tr:has-text("${jobName}")`).locator('td').nth(4)).toContainText('Rework');
    
    // --- 3. CLEANUP ---
    console.log('Step 3: Cleanup');
    await page.goto('/jobs/teams', { waitUntil: 'networkidle' });
    await page.getByTestId('team-search-input').fill(teamName);
    const cleanupCard = page.locator('.team-card', { hasText: teamName }).first();
    await cleanupCard.getByTestId('delete-team-btn').click();
    
    console.log('✅ Admin & Exception Test Passed');
  });

});
