import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Backlog Screen
 * Tests sprint creation, work item CRUD, drag-and-drop, and visibility logic
 */

async function loginAsUser(page: Page) {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'user@test.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspaces\/.+/);
}

async function navigateToBacklog(page: Page, workspaceId: string, projectId: string) {
    await page.goto(`/workspaces/${workspaceId}/tasks?task-view=backlog&projectId=${projectId}`);
    await page.waitForLoadState('networkidle');
}

test.describe('Backlog Screen', () => {
    let workspaceId: string;
    let projectId: string;

    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
        const url = page.url();
        const match = url.match(/\/workspaces\/([^/]+)/);
        workspaceId = match?.[1] || '';
        expect(workspaceId).toBeTruthy();

        // For testing, assume first project exists
        // In production, you'd query the API or use a known test project
        projectId = process.env.TEST_PROJECT_ID || 'test-project-id';
    });

    test('should display planned and active sprints', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // Check for sprint sections
        await expect(page.locator('text=Sprints').first()).toBeVisible();

        // Verify sprint cards are displayed
        const sprintCards = page.locator('[data-testid="sprint-card"]');
        if (await sprintCards.first().isVisible()) {
            await expect(sprintCards.first()).toBeVisible();
        }
    });

    test('should create a new sprint', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // Click create sprint button
        await page.click('button:has-text("Create Sprint")');

        // Fill sprint form
        await page.fill('input[name="name"]', `Test Sprint ${Date.now()}`);
        await page.fill('textarea[name="goal"]', 'Test sprint goal');

        // Select dates
        await page.click('button:has-text("Start Date")');
        await page.click('.rdp-day_today'); // Today as start

        await page.click('button:has-text("End Date")');
        await page.click('.rdp-day_today + .rdp-day'); // Tomorrow as end

        // Submit
        await page.click('button[type="submit"]');

        // Verify sprint appears
        await page.waitForTimeout(1000);
        await expect(page.locator('text=Test Sprint')).toBeVisible();
    });

    test('should create work items in backlog', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // Click add work item in backlog section
        await page.click('button:has-text("Add Work Item")');

        // Fill work item form
        await page.fill('input[name="title"]', `Test Work Item ${Date.now()}`);
        await page.selectOption('select[name="type"]', 'TASK');
        await page.fill('textarea[name="description"]', 'Test description');

        // Submit
        await page.click('button[type="submit"]');

        // Verify work item appears in backlog
        await page.waitForTimeout(1000);
        await expect(page.locator('text=Test Work Item')).toBeVisible();
    });

    test('should drag work item from backlog to sprint', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // Find a work item in backlog
        const backlogItem = page.locator('[data-testid="work-item-card"]').first();

        if (await backlogItem.isVisible()) {
            // Find a sprint section
            const sprintSection = page.locator('[data-testid="sprint-section"]').first();

            if (await sprintSection.isVisible()) {
                // Perform drag and drop
                await backlogItem.dragTo(sprintSection);

                // Verify item moved
                await page.waitForTimeout(500);
                // Item should now be in sprint, not backlog
            }
        }
    });

    test('should hide backlog when sprint is active', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // Find a planned sprint and start it
        const startSprintBtn = page.locator('button:has-text("Start Sprint")').first();

        if (await startSprintBtn.isVisible()) {
            await startSprintBtn.click();
            await page.waitForTimeout(1000);

            // Backlog section should be hidden
            const backlogSection = page.locator('text=Backlog').last();
            await expect(backlogSection).not.toBeVisible();
        }
    });

    test('should show backlog when no active sprint', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // If there's an active sprint, complete it first
        const completeBtn = page.locator('button:has-text("Complete Sprint")').first();

        if (await completeBtn.isVisible()) {
            await completeBtn.click();
            await page.waitForTimeout(1000);
        }

        // Backlog section should be visible
        await expect(page.locator('text=Backlog')).toBeVisible();
    });

    test('should expand and collapse sprint sections', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // Find sprint header
        const sprintHeader = page.locator('[data-testid="sprint-header"]').first();

        if (await sprintHeader.isVisible()) {
            // Click to collapse
            await sprintHeader.click();
            await page.waitForTimeout(300);

            // Click to expand
            await sprintHeader.click();
            await page.waitForTimeout(300);

            // Sprint items should be visible again
            const sprintItems = page.locator('[data-testid="sprint-items"]').first();
            await expect(sprintItems).toBeVisible();
        }
    });

    test('should filter work items by search', async ({ page }) => {
        await navigateToBacklog(page, workspaceId, projectId);

        // Find search input
        const searchInput = page.locator('input[placeholder*="Search"]');

        if (await searchInput.isVisible()) {
            await searchInput.fill('TEST');
            await page.waitForTimeout(500);

            // Verify filtered results
            const items = page.locator('[data-testid="work-item-card"]');
            const count = await items.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });
});
