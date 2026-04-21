# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: advanced_lifecycle.spec.js >> Advanced Job Lifecycle >> should complete a full production flow: schedule -> produce -> QC approve
- Location: tests\advanced_lifecycle.spec.js:14:3

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "http://localhost:5173/inventory/requests", waiting until "networkidle"

```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | test.describe('Advanced Job Lifecycle', () => {
  4   |   
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/login', { waitUntil: 'networkidle' });
  7   |     await page.fill('input[type="email"]', 'admin@factory.com');
  8   |     await page.fill('input[type="password"]', 'admin123');
  9   |     await page.selectOption('select', 'Job Manager');
  10  |     await page.click('button[type="submit"]');
  11  |     await expect(page).toHaveURL(/\/jobs$/);
  12  |   });
  13  | 
  14  |   test('should complete a full production flow: schedule -> produce -> QC approve', async ({ page }) => {
  15  |     const productName = `AdvancedTest-${Date.now()}`;
  16  |     
  17  |     // 1. CREATE JOB WITH COMPONENT
  18  |     await page.click('button:has-text("Create New Job")');
  19  |     await page.fill('#product', productName);
  20  |     await page.fill('#quantity', '20');
  21  |     await page.selectOption('#team', 'Default Production Team');
  22  |     
  23  |     const tomorrow = new Date();
  24  |     tomorrow.setDate(tomorrow.getDate() + 1);
  25  |     await page.fill('#deadline', tomorrow.toISOString().split('T')[0]);
  26  |     
  27  |     await page.click('button:has-text("+ Add Component")');
  28  |     await page.fill('input[placeholder="Component Name (e.g. Screen)"]', 'Control Board');
  29  |     await page.fill('input[placeholder="Qty"]', '1');
  30  |     
  31  |     await Promise.all([
  32  |       page.waitForResponse(r => r.url().includes('/api/jobs') && r.request().method() === 'POST'),
  33  |       page.click('button:has-text("Create Job")')
  34  |     ]);
  35  |     
  36  |     await expect(page).toHaveURL(/\/jobs$/);
  37  |     
  38  |     // 2. APPROVE MATERIALS (INVENTORY CONTEXT)
  39  |     console.log('Step 2: Approving Material Requests (Inventory)');
  40  |     await page.fill('input[placeholder="Search products, teams, or IDs..."]', productName);
  41  |     const jobRow = page.locator(`tr:has-text("${productName}")`);
  42  |     await jobRow.click();
  43  |     
  44  |     const trackingUrl = page.url();
  45  |     const jobId = trackingUrl.split('/').pop();
  46  |     console.log(`Detected Job ID: ${jobId}`);
  47  | 
> 48  |     await page.goto('/inventory/requests', { waitUntil: 'networkidle' });
      |                ^ Error: page.goto: Target page, context or browser has been closed
  49  |     const requestRow = page.getByTestId(`request-row-${jobId}`);
  50  |     await expect(requestRow).toBeVisible({ timeout: 15000 });
  51  |     await requestRow.getByTestId('approve-request-btn').click();
  52  |     console.log('Materials Approved.');
  53  | 
  54  |     // 3. TRACKING: MATERIALS READY -> SCHEDULE
  55  |     console.log('Step 3: Materials Ready & Scheduling');
  56  |     await page.goto(trackingUrl, { waitUntil: 'networkidle' });
  57  |     
  58  |     const stageSelect = page.locator('select').first();
  59  |     await Promise.all([
  60  |         page.waitForResponse(r => r.url().includes('/api/jobs/')),
  61  |         stageSelect.selectOption('Materials Ready')
  62  |     ]);
  63  |     
  64  |     await page.click('button:has-text("Schedule")');
  65  |     const scheduleBtn = page.locator('button:has-text("Auto-Schedule Tasks")');
  66  |     await expect(scheduleBtn).toBeEnabled({ timeout: 15000 });
  67  |     
  68  |     await Promise.all([
  69  |         page.waitForResponse(r => r.url().includes('/api/schedule/')),
  70  |         scheduleBtn.click()
  71  |     ]);
  72  |     console.log('Schedule generated. Waiting for DB propagation...');
  73  |     await page.waitForTimeout(2000); // Small buffer for DB commit
  74  |     
  75  |     // 4. COMPLETE WORKER TASKS
  76  |     console.log('Step 4: Completing Worker Tasks');
  77  |     await page.click('button:has-text("Worker Tasks")');
  78  |     
  79  |     // Retry logic: if tasks don't appear in 5s, reload once
  80  |     const firstRow = page.getByTestId('task-row').first();
  81  |     try {
  82  |         await expect(firstRow).toBeVisible({ timeout: 5000 });
  83  |     } catch (e) {
  84  |         console.log('Tasks not visible yet, reloading page...');
  85  |         await page.reload({ waitUntil: 'networkidle' });
  86  |         await expect(firstRow).toBeVisible({ timeout: 15000 });
  87  |     }
  88  | 
  89  |     // Use Global Action Polling with Sync-Lock (resilient to DOM re-renders)
  90  |     for (let attempt = 0; attempt < 30; attempt++) {
  91  |       const startBtn = page.locator('[data-testid="task-row"] button:has-text("Start")').filter({ visible: true }).first();
  92  |       const finishBtn = page.locator('[data-testid="task-row"] button:has-text("Finish")').filter({ visible: true }).first();
  93  |       
  94  |       if (await startBtn.count() > 0) {
  95  |         console.log(`Starting available task...`);
  96  |         await Promise.all([
  97  |           page.waitForResponse(r => r.url().includes('/api/tasks/') && r.request().method() === 'PUT', { timeout: 15000 }),
  98  |           startBtn.click({ force: true })
  99  |         ]);
  100 |         await page.waitForTimeout(500); 
  101 |       } else if (await finishBtn.count() > 0) {
  102 |         console.log(`Finishing active task...`);
  103 |         await Promise.all([
  104 |           page.waitForResponse(r => r.url().includes('/api/tasks/') && r.request().method() === 'PUT', { timeout: 15000 }),
  105 |           finishBtn.click({ force: true })
  106 |         ]);
  107 |         await page.waitForTimeout(500);
  108 |       } else {
  109 |         // Check if any tasks are still pending/in-progress but blocked
  110 |         const pendingOrProgress = await page.locator('[data-testid="task-row"]:has-text("Pending"), [data-testid="task-row"]:has-text("In Progress")').count();
  111 |         if (pendingOrProgress === 0) {
  112 |           console.log('No more active tasks. Done.');
  113 |           break;
  114 |         }
  115 |         
  116 |         console.log('Tasks are currently blocked or loading. Waiting...');
  117 |         await page.waitForTimeout(2000);
  118 |       }
  119 |     }
  120 |     console.log('All worker tasks completed.');
  121 |     
  122 |     // 4. QC APPROVAL
  123 |     await page.click('button:has-text("Go Back")');
  124 |     await page.click('button:has-text("Overview")');
  125 |     const overviewStage = page.locator('select').first();
  126 |     await Promise.all([
  127 |         page.waitForResponse(r => r.url().includes('/api/jobs/')),
  128 |         overviewStage.selectOption('Quality Check')
  129 |     ]);
  130 |     
  131 |     await page.click('button:has-text("Quality Check")');
  132 |     const boxes = page.locator('button.w-6.h-6.rounded.border-2');
  133 |     await expect(boxes.first()).toBeVisible();
  134 |     const boxCount = await boxes.count();
  135 |     for (let i = 0; i < boxCount; i++) {
  136 |       await boxes.nth(i).click();
  137 |       await page.waitForTimeout(200);
  138 |     }
  139 |     
  140 |     await Promise.all([
  141 |         page.waitForResponse(r => r.url().includes('/api/qc')),
  142 |         page.click('button:has-text("Approve & Complete")')
  143 |     ]);
  144 |     
  145 |     await expect(page).toHaveURL(/\/jobs$/);
  146 |     await expect(page.locator(`tr:has-text("${productName}")`).locator('td').nth(4)).toContainText('Completed');
  147 |     console.log('✅ Advanced Lifecycle Test Passed');
  148 |   });
```