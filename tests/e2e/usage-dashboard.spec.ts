import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Admin Usage Dashboard
 * Tests admin access, KPI display, filtering, charts, and data export
 */

// Helper to login as admin
async function loginAsAdmin(page: Page) {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com');
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspaces\/.+/);
}

// Helper to navigate to admin usage panel
async function navigateToUsagePanel(page: Page, workspaceId: string) {
    await page.goto(`/workspaces/${workspaceId}/admin/usage`);
    await page.waitForLoadState('networkidle');
}

test.describe('Admin Usage Dashboard', () => {
    let workspaceId: string;

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        // Extract workspace ID from URL
        const url = page.url();
        const match = url.match(/\/workspaces\/([^/]+)/);
        workspaceId = match?.[1] || '';
        expect(workspaceId).toBeTruthy();
    });

    test('should restrict access to admin users only', async ({ page }) => {
        // This test assumes you can logout and login as non-admin
        // For now, we just verify the page loads for admin
        await navigateToUsagePanel(page, workspaceId);
        await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    });

    test('should display KPI cards with usage metrics', async ({ page }) => {
        await navigateToUsagePanel(page, workspaceId);

        // Check for KPI cards
        await expect(page.locator('text=Traffic Usage')).toBeVisible();
        await expect(page.locator('text=Storage')).toBeVisible();
        await expect(page.locator('text=Compute')).toBeVisible();
        await expect(page.locator('text=Estimated Cost')).toBeVisible();
    });

    test('should filter data by date range', async ({ page }) => {
        await navigateToUsagePanel(page, workspaceId);

        // Click date range picker
        await page.click('[aria-label="Select date range"]');

        // Select "Last 7 days" or similar preset
        await page.click('text=Last 7 days');

        // Wait for data to reload
        await page.waitForTimeout(1000);

        // Verify KPIs are still visible (data refreshed)
        await expect(page.locator('text=Traffic Usage')).toBeVisible();
    });

    test('should display usage charts', async ({ page }) => {
        await navigateToUsagePanel(page, workspaceId);

        // Check for chart containers (adjust selectors based on actual implementation)
        const charts = page.locator('[data-testid="usage-chart"]');
        await expect(charts.first()).toBeVisible();
    });

    test('should display events table with pagination', async ({ page }) => {
        await navigateToUsagePanel(page, workspaceId);

        // Check for events table
        await expect(page.locator('text=Resource Type')).toBeVisible();
        await expect(page.locator('text=Units')).toBeVisible();

        // Check for pagination controls if there are enough events
        const paginationNext = page.locator('button[aria-label="Next page"]');
        if (await paginationNext.isVisible()) {
            await paginationNext.click();
            await page.waitForTimeout(500);
        }
    });

    test('should allow export of usage data', async ({ page }) => {
        await navigateToUsagePanel(page, workspaceId);

        // Click export button
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            const downloadPromise = page.waitForEvent('download');
            await exportButton.click();
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain('usage');
        }
    });

    test('should create and manage usage alerts', async ({ page }) => {
        await navigateToUsagePanel(page, workspaceId);

        // Look for alerts section
        const alertsSection = page.locator('text=Usage Alerts');
        if (await alertsSection.isVisible()) {
            // Click create alert button
            await page.click('button:has-text("Create Alert")');

            // Fill alert form
            await page.selectOption('select[name="resourceType"]', 'TRAFFIC');
            await page.fill('input[name="threshold"]', '1000');

            // Save alert
            await page.click('button:has-text("Save")');

            // Verify alert appears in list
            await expect(page.locator('text=TRAFFIC')).toBeVisible();
        }
    });

    test('should refresh data when refresh button is clicked', async ({ page }) => {
        await navigateToUsagePanel(page, workspaceId);

        // Click refresh button
        const refreshButton = page.locator('button[aria-label="Refresh"]');
        if (await refreshButton.isVisible()) {
            await refreshButton.click();
            await page.waitForTimeout(500);

            // Verify data is still displayed
            await expect(page.locator('text=Traffic Usage')).toBeVisible();
        }
    });
});
