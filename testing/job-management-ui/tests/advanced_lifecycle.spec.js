const { test, expect } = require('@playwright/test');

test.describe('Advanced Job Lifecycle', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@factory.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.selectOption('select', 'Job Manager');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test('should complete a full production flow: schedule -> produce -> QC approve', async ({ page }) => {
    const productName = `AdvancedTest-${Date.now()}`;
    
    // 1. CREATE JOB WITH COMPONENT
    await page.click('button:has-text("Create New Job")');
    await page.fill('#product', productName);
    await page.fill('#quantity', '20');
    await page.selectOption('#team', 'Default Production Team');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('#deadline', tomorrow.toISOString().split('T')[0]);
    
    await page.click('button:has-text("+ Add Component")');
    await page.fill('input[placeholder="Component Name (e.g. Screen)"]', 'Control Board');
    await page.fill('input[placeholder="Qty"]', '1');
    
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/jobs') && r.request().method() === 'POST'),
      page.click('button:has-text("Create Job")')
    ]);
    
    await expect(page).toHaveURL(/\/jobs$/);
    
    // 2. APPROVE MATERIALS (INVENTORY CONTEXT)
    console.log('Step 2: Approving Material Requests (Inventory)');
    await page.fill('input[placeholder="Search products, teams, or IDs..."]', productName);
    const jobRow = page.locator(`tr:has-text("${productName}")`);
    await jobRow.click();
    
    const trackingUrl = page.url();
    const jobId = trackingUrl.split('/').pop();
    console.log(`Detected Job ID: ${jobId}`);

    await page.goto('/inventory/requests', { waitUntil: 'networkidle' });
    const requestRow = page.getByTestId(`request-row-${jobId}`);
    await expect(requestRow).toBeVisible({ timeout: 15000 });
    await requestRow.getByTestId('approve-request-btn').click();
    console.log('Materials Approved.');

    // 3. TRACKING: MATERIALS READY -> SCHEDULE
    console.log('Step 3: Materials Ready & Scheduling');
    await page.goto(trackingUrl, { waitUntil: 'networkidle' });
    
    const stageSelect = page.locator('select').first();
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/jobs/')),
        stageSelect.selectOption('Materials Ready')
    ]);
    
    await page.click('button:has-text("Schedule")');
    const scheduleBtn = page.locator('button:has-text("Auto-Schedule Tasks")');
    await expect(scheduleBtn).toBeEnabled({ timeout: 15000 });
    
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/schedule/')),
        scheduleBtn.click()
    ]);
    console.log('Schedule generated. Waiting for DB propagation...');
    await page.waitForTimeout(2000); // Small buffer for DB commit
    
    // 4. COMPLETE WORKER TASKS
    console.log('Step 4: Completing Worker Tasks');
    await page.click('button:has-text("Worker Tasks")');
    
    // Retry logic: if tasks don't appear in 5s, reload once
    const firstRow = page.getByTestId('task-row').first();
    try {
        await expect(firstRow).toBeVisible({ timeout: 5000 });
    } catch (e) {
        console.log('Tasks not visible yet, reloading page...');
        await page.reload({ waitUntil: 'networkidle' });
        await expect(firstRow).toBeVisible({ timeout: 15000 });
    }

    // Use Global Action Polling with Sync-Lock (resilient to DOM re-renders)
    for (let attempt = 0; attempt < 30; attempt++) {
      const startBtn = page.locator('[data-testid="task-row"] button:has-text("Start")').filter({ visible: true }).first();
      const finishBtn = page.locator('[data-testid="task-row"] button:has-text("Finish")').filter({ visible: true }).first();
      
      if (await startBtn.count() > 0) {
        console.log(`Starting available task...`);
        await Promise.all([
          page.waitForResponse(r => r.url().includes('/api/tasks/') && r.request().method() === 'PUT', { timeout: 15000 }),
          startBtn.click({ force: true })
        ]);
        await page.waitForTimeout(500); 
      } else if (await finishBtn.count() > 0) {
        console.log(`Finishing active task...`);
        await Promise.all([
          page.waitForResponse(r => r.url().includes('/api/tasks/') && r.request().method() === 'PUT', { timeout: 15000 }),
          finishBtn.click({ force: true })
        ]);
        await page.waitForTimeout(500);
      } else {
        // Check if any tasks are still pending/in-progress but blocked
        const pendingOrProgress = await page.locator('[data-testid="task-row"]:has-text("Pending"), [data-testid="task-row"]:has-text("In Progress")').count();
        if (pendingOrProgress === 0) {
          console.log('No more active tasks. Done.');
          break;
        }
        
        console.log('Tasks are currently blocked or loading. Waiting...');
        await page.waitForTimeout(2000);
      }
    }
    console.log('All worker tasks completed.');
    
    // 4. QC APPROVAL
    await page.click('button:has-text("Go Back")');
    await page.click('button:has-text("Overview")');
    const overviewStage = page.locator('select').first();
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/jobs/')),
        overviewStage.selectOption('Quality Check')
    ]);
    
    await page.click('button:has-text("Quality Check")');
    const boxes = page.locator('button.w-6.h-6.rounded.border-2');
    await expect(boxes.first()).toBeVisible();
    const boxCount = await boxes.count();
    for (let i = 0; i < boxCount; i++) {
      await boxes.nth(i).click();
      await page.waitForTimeout(200);
    }
    
    await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/qc')),
        page.click('button:has-text("Approve & Complete")')
    ]);
    
    await expect(page).toHaveURL(/\/jobs$/);
    await expect(page.locator(`tr:has-text("${productName}")`).locator('td').nth(4)).toContainText('Completed');
    console.log('✅ Advanced Lifecycle Test Passed');
  });
});
