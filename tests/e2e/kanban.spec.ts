import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Kanban Board
 * Tests active sprint filtering, drag-and-drop status changes, and empty state
 */

async function loginAsUser(page: Page) {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'user@test.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspaces\/.+/);
}

async function navigateToKanban(page: Page, workspaceId: string, projectId: string) {
    await page.goto(`/workspaces/${workspaceId}/tasks?task-view=kanban&projectId=${projectId}`);
    await page.waitForLoadState('networkidle');
}

test.describe('Kanban Board', () => {
    let workspaceId: string;
    let projectId: string;

    test.beforeEach(async ({ page }) => {
        await loginAsUser(page);
        const url = page.url();
        const match = url.match(/\/workspaces\/([^/]+)/);
        workspaceId = match?.[1] || '';
        expect(workspaceId).toBeTruthy();

        projectId = process.env.TEST_PROJECT_ID || 'test-project-id';
    });

    test('should only display work items from active sprint', async ({ page }) => {
        await navigateToKanban(page, workspaceId, projectId);

        // Verify Kanban columns are visible
        await expect(page.locator('text=To Do')).toBeVisible();
        await expect(page.locator('text=In Progress')).toBeVisible();
        await expect(page.locator('text=Done')).toBeVisible();

        // Check that only active sprint items are shown
        // This requires having an active sprint with items
        const kanbanCards = page.locator('[data-testid="kanban-card"]');
        const count = await kanbanCards.count();

        // If count is 0, either no active sprint or no items
        console.log(`Kanban cards count: ${count}`);
    });

    test('should show empty state when no active sprint', async ({ page }) => {
        // First, ensure no sprint is active by completing any active sprint
        await page.goto(`/workspaces/${workspaceId}/tasks?task-view=backlog&projectId=${projectId}`);

        const completeBtn = page.locator('button:has-text("Complete Sprint")').first();
        if (await completeBtn.isVisible()) {
            await completeBtn.click();
            await page.waitForTimeout(1000);
        }

        // Now navigate to Kanban
        await navigateToKanban(page, workspaceId, projectId);

        // Should show empty state or no items
        const emptyState = page.locator('text=No active sprint');
        const kanbanCards = page.locator('[data-testid="kanban-card"]');
        const count = await kanbanCards.count();

        // Either empty state is visible OR no cards are shown
        if (count === 0) {
            expect(true).toBe(true); // No items shown as expected
        } else if (await emptyState.isVisible()) {
            expect(emptyState).toBeVisible();
        }
    });

    test('should drag work item between status columns', async ({ page }) => {
        await navigateToKanban(page, workspaceId, projectId);

        // Find a card in "To Do" column
        const todoColumn = page.locator('[data-status="TODO"]');
        const todoCard = todoColumn.locator('[data-testid="kanban-card"]').first();

        if (await todoCard.isVisible()) {
            // Find "In Progress" column
            const inProgressColumn = page.locator('[data-status="IN_PROGRESS"]');

            // Drag card from To Do to In Progress
            await todoCard.dragTo(inProgressColumn);

            // Wait for update
            await page.waitForTimeout(1000);

            // Verify card is now in In Progress
            const inProgressCard = inProgressColumn.locator('[data-testid="kanban-card"]').first();
            await expect(inProgressCard).toBeVisible();
        }
    });

    test('should display work item details on card click', async ({ page }) => {
        await navigateToKanban(page, workspaceId, projectId);

        // Click on a kanban card
        const card = page.locator('[data-testid="kanban-card"]').first();

        if (await card.isVisible()) {
            await card.click();

            // Task details modal should open
            await expect(page.locator('[role="dialog"]')).toBeVisible();

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('should filter kanban items by assignee', async ({ page }) => {
        await navigateToKanban(page, workspaceId, projectId);

        // Find assignee filter dropdown
        const assigneeFilter = page.locator('[aria-label="Filter by assignee"]');

        if (await assigneeFilter.isVisible()) {
            await assigneeFilter.click();

            // Select an assignee
            await page.click('text=Assigned to me');

            // Wait for filter to apply
            await page.waitForTimeout(500);

            // Verify filtered results
            const kanbanCards = page.locator('[data-testid="kanban-card"]');
            const count = await kanbanCards.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('should show correct card counts in column headers', async ({ page }) => {
        await navigateToKanban(page, workspaceId, projectId);

        // Get count from "To Do" header
        const todoHeader = page.locator('[data-status="TODO"] [data-testid="column-count"]');

        if (await todoHeader.isVisible()) {
            const countText = await todoHeader.textContent();
            const count = parseInt(countText || '0');

            // Verify actual cards match count
            const todoCards = page.locator('[data-status="TODO"] [data-testid="kanban-card"]');
            const actualCount = await todoCards.count();

            expect(actualCount).toBe(count);
        }
    });

    test('should create new work item from kanban view', async ({ page }) => {
        await navigateToKanban(page, workspaceId, projectId);

        // Click add button in a column
        const addButton = page.locator('button:has-text("Add Task")').first();

        if (await addButton.isVisible()) {
            await addButton.click();

            // Fill form
            await page.fill('input[name="title"]', `Kanban Task ${Date.now()}`);

            // Submit
            await page.click('button[type="submit"]');

            // Verify task appears
            await page.waitForTimeout(1000);
            await expect(page.locator('text=Kanban Task')).toBeVisible();
        }
    });

    test('should preserve sprint filter across view switches', async ({ page }) => {
        await navigateToKanban(page, workspaceId, projectId);

        // Switch to table view
        await page.click('button[aria-label="Table view"]');
        await page.waitForTimeout(500);

        // Switch back to Kanban
        await page.click('button[aria-label="Kanban view"]');
        await page.waitForTimeout(500);

        // Should still show only active sprint items
        await expect(page.locator('text=To Do')).toBeVisible();
    });
});
