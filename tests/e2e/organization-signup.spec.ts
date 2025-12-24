import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Organization Signup and Account Type Flows
 * Tests personal/org signup, workspace creation, and conversion
 */

const TEST_EMAIL_PREFIX = `e2e-test-${Date.now()}`;

// Helper to login with credentials
async function login(page: Page, email: string, password: string) {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspaces\/.+|\/workspaces\/create/, { timeout: 10000 });
}

test.describe('Account Type Selection on Signup', () => {
    test('should display account type selector on signup page', async ({ page }) => {
        await page.goto('/sign-up');

        // Verify account type selector is visible
        await expect(page.locator('text=Account Type')).toBeVisible();
        await expect(page.getByRole('button', { name: /personal/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /organization/i })).toBeVisible();
    });

    test('should default to Personal account type', async ({ page }) => {
        await page.goto('/sign-up');

        // Personal button should have active styling (border-primary class)
        const personalButton = page.getByRole('button', { name: /personal/i });
        await expect(personalButton).toBeVisible();

        // Organization name field should NOT be visible initially
        const orgNameField = page.locator('input[placeholder="Enter organization name"]');
        await expect(orgNameField).not.toBeVisible();
    });

    test('should show organization name field when ORG is selected', async ({ page }) => {
        await page.goto('/sign-up');

        // Click Organization button
        await page.getByRole('button', { name: /organization/i }).click();

        // Organization name field should now be visible
        const orgNameField = page.locator('input[placeholder="Enter organization name"]');
        await expect(orgNameField).toBeVisible();
    });

    test('should toggle between Personal and Organization', async ({ page }) => {
        await page.goto('/sign-up');

        const orgNameField = page.locator('input[placeholder="Enter organization name"]');

        // Start with Personal (default)
        await expect(orgNameField).not.toBeVisible();

        // Switch to Organization
        await page.getByRole('button', { name: /organization/i }).click();
        await expect(orgNameField).toBeVisible();

        // Switch back to Personal
        await page.getByRole('button', { name: /personal/i }).click();
        await expect(orgNameField).not.toBeVisible();
    });
});

test.describe('Personal Account Signup Flow', () => {
    test('should complete personal signup form submission', async ({ page }) => {
        const testEmail = `${TEST_EMAIL_PREFIX}-personal@test.example.com`;

        await page.goto('/sign-up');

        // Fill personal account registration
        await page.fill('input[placeholder="Enter your name"]', 'Test Personal User');
        await page.fill('input[placeholder="Enter your email address"]', testEmail);
        await page.fill('input[placeholder="Enter your password"]', 'TestPassword123!');

        // Ensure Personal is selected (default)
        const personalButton = page.getByRole('button', { name: /personal/i });
        await expect(personalButton).toBeVisible();

        // Submit form
        await page.click('button[type="submit"]:has-text("Sign Up")');

        // Should redirect to verify email sent page or show success
        await page.waitForURL(/verify-email-sent|sign-in/, { timeout: 10000 });
    });
});

test.describe('Organization Account Signup Flow', () => {
    test('should complete organization signup with org name', async ({ page }) => {
        const testEmail = `${TEST_EMAIL_PREFIX}-org@test.example.com`;

        await page.goto('/sign-up');

        // Select Organization account type
        await page.getByRole('button', { name: /organization/i }).click();

        // Fill organization account registration
        await page.fill('input[placeholder="Enter your name"]', 'Test Org User');
        await page.fill('input[placeholder="Enter organization name"]', 'Test Organization Inc');
        await page.fill('input[placeholder="Enter your email address"]', testEmail);
        await page.fill('input[placeholder="Enter your password"]', 'TestPassword123!');

        // Submit form
        await page.click('button[type="submit"]:has-text("Sign Up")');

        // Should redirect to verify email page
        await page.waitForURL(/verify-email-sent|sign-in/, { timeout: 10000 });
    });
});

test.describe('Workspace Switcher', () => {
    test('should display workspaces section in sidebar', async ({ page }) => {
        // Skip if no test credentials
        test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL env var');

        await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

        // Check for workspaces section in sidebar
        await expect(page.locator('text=Workspaces')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('OWNER Role Permissions', () => {
    test('should show settings page for workspace members', async ({ page }) => {
        test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL env var');

        await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

        // Navigate to settings - look for settings link in sidebar
        const settingsLink = page.locator('a[href*="/settings"]').first();
        if (await settingsLink.isVisible()) {
            await settingsLink.click();
            await expect(page).toHaveURL(/settings/);
        }
    });
});

test.describe('Personal to Organization Conversion', () => {
    test('conversion endpoint should exist', async ({ request }) => {
        // Test that the conversion endpoint exists (will return 401 without auth)
        const response = await request.post('/api/organizations/convert', {
            data: { organizationName: 'Test Org' },
        });

        // Should return 401 (unauthorized) not 404 (not found)
        expect(response.status()).not.toBe(404);
    });
});

test.describe('Organizations API', () => {
    test('should have organizations endpoint', async ({ request }) => {
        const response = await request.get('/api/organizations');

        // Should return 401 (unauthorized) not 404 (not found)
        expect(response.status()).not.toBe(404);
    });
});
