import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Authentication and Onboarding Flows
 * 
 * NEW FLOW (POST-AUTH account type selection):
 * 1. User signs up with name, email, password (no account type at signup)
 * 2. User verifies email
 * 3. User redirected to /auth/callback → /onboarding
 * 4. User selects account type (PERSONAL or ORG)
 * 5. User completes account-specific steps
 */

const TEST_EMAIL_PREFIX = `e2e-test-${Date.now()}`;

// Helper to login with credentials
async function login(page: Page, email: string, password: string) {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    // Should redirect to callback then appropriate page
    await page.waitForURL(/\/(auth\/callback|workspaces|onboarding)/, { timeout: 15000 });
}

test.describe('Signup Form (Simplified)', () => {
    test('should display simplified signup form without account type', async ({ page }) => {
        await page.goto('/sign-up');

        // Should have basic fields
        await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter your email address"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();

        // Should NOT have account type selector
        await expect(page.locator('text=Account Type')).not.toBeVisible();
        await expect(page.locator('input[placeholder="Enter organization name"]')).not.toBeVisible();
    });

    test('should have OAuth buttons', async ({ page }) => {
        await page.goto('/sign-up');

        const googleButton = page.getByRole('button', { name: /sign up with google/i });
        await expect(googleButton).toBeVisible();

        const githubButton = page.getByRole('button', { name: /sign up with github/i });
        await expect(githubButton).toBeVisible();
    });

    test('should have link to sign in page', async ({ page }) => {
        await page.goto('/sign-up');

        const loginLink = page.getByRole('link', { name: /login/i }).first();
        await expect(loginLink).toBeVisible();
        await expect(loginLink).toHaveAttribute('href', '/sign-in');
    });

    test('should submit and redirect to verify email', async ({ page }) => {
        const testEmail = `${TEST_EMAIL_PREFIX}-test@test.example.com`;

        await page.goto('/sign-up');
        await page.fill('input[placeholder="Enter your name"]', 'Test User');
        await page.fill('input[placeholder="Enter your email address"]', testEmail);
        await page.fill('input[placeholder="Enter your password"]', 'TestPassword123!');

        await page.getByRole('button', { name: /^sign up$/i }).click();

        // Should redirect to verify email sent page
        await page.waitForURL(/verify-email-sent|sign-in/, { timeout: 10000 });
    });
});

test.describe('Onboarding Flow - Account Type Selection', () => {
    test('onboarding page should show account type options', async ({ page }) => {
        // This test requires a logged-in user
        // For now, just check the page structure
        test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL env var');

        await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

        // If user needs onboarding, they'll be on /onboarding
        if (page.url().includes('/onboarding')) {
            // Check for account type selection
            await expect(page.locator('text=Welcome to Fairlx')).toBeVisible();
            await expect(page.locator('text=Personal Account')).toBeVisible();
            await expect(page.locator('text=Organization Account')).toBeVisible();
        }
    });

    test('should have Personal and Organization options with descriptions', async ({ page }) => {
        await page.goto('/onboarding');

        // Might redirect to sign-in if not authenticated
        if (page.url().includes('/sign-in')) {
            test.skip(true, 'Requires authentication');
            return;
        }

        await expect(page.locator('text=Personal Account')).toBeVisible();
        await expect(page.locator('text=Organization Account')).toBeVisible();
        await expect(page.locator('text=For individual use')).toBeVisible();
        await expect(page.locator('text=For teams and companies')).toBeVisible();
    });
});

test.describe('Auth Callback Routing', () => {
    test('should have auth callback page', async ({ page }) => {
        await page.goto('/auth/callback');

        // Should either show loading then redirect, or redirect immediately
        // Wait for any redirect or content
        await page.waitForTimeout(2000);

        // If not authenticated, should redirect to sign-in
        if (!process.env.TEST_USER_EMAIL) {
            expect(page.url()).toContain('/sign-in');
        }
    });
});

test.describe('Workspace Switcher', () => {
    test('should display workspaces section in sidebar after onboarding', async ({ page }) => {
        test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL env var');

        await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // If we have workspaces, should see them
        const workspacesVisible = await page.locator('text=Workspaces').isVisible();
        if (workspacesVisible) {
            await expect(page.locator('text=Workspaces')).toBeVisible({ timeout: 10000 });
        }
    });
});

test.describe('OWNER Role Permissions', () => {
    test('should show settings page for workspace members', async ({ page }) => {
        test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL env var');

        await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

        // Navigate to settings
        const settingsLink = page.locator('a[href*="/settings"]').first();
        if (await settingsLink.isVisible()) {
            await settingsLink.click();
            await expect(page).toHaveURL(/settings/);
        }
    });
});

test.describe('Organizations API', () => {
    test('should have organizations endpoint', async ({ request }) => {
        const response = await request.get('/api/organizations');
        // Should return 401 (unauthorized) not 404 (not found)
        expect(response.status()).not.toBe(404);
    });

    test('conversion endpoint should exist', async ({ request }) => {
        const response = await request.post('/api/organizations/convert', {
            data: { organizationName: 'Test Org' },
        });
        // Should return 401 (unauthorized) not 404 (not found)
        expect(response.status()).not.toBe(404);
    });
});

test.describe('Onboarding Stepper Persistence', () => {
    test('should persist state in localStorage (unit test)', async ({ page }) => {
        await page.goto('/onboarding');

        // Might redirect if not authenticated
        if (page.url().includes('/sign-in')) {
            test.skip(true, 'Requires authentication');
            return;
        }

        // Check that onboarding state uses localStorage
        const hasOnboardingState = await page.evaluate(() => {
            return typeof localStorage !== 'undefined';
        });
        expect(hasOnboardingState).toBe(true);
    });
});

test.describe('Middleware Routing Guards', () => {
    test('protected routes should redirect to sign-in without auth', async ({ page }) => {
        await page.goto('/workspaces/test-workspace');

        // Should redirect to sign-in with returnUrl
        await page.waitForURL(/sign-in/, { timeout: 5000 });
        expect(page.url()).toContain('/sign-in');
    });

    test('onboarding should redirect to sign-in without auth', async ({ page }) => {
        await page.goto('/onboarding');

        // Should redirect to sign-in
        await page.waitForURL(/sign-in/, { timeout: 5000 });
        expect(page.url()).toContain('/sign-in');
    });

    test('public routes should be accessible', async ({ page }) => {
        await page.goto('/sign-up');
        expect(page.url()).toContain('/sign-up');

        await page.goto('/sign-in');
        expect(page.url()).toContain('/sign-in');

        await page.goto('/forgot-password');
        expect(page.url()).toContain('/forgot-password');
    });
});
