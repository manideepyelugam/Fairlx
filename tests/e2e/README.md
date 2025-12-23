# Playwright E2E Testing Guide

This directory contains end-to-end tests for the Fairlx application using Playwright.

## Test Files

1. **usage-dashboard.spec.ts** - Tests for Admin Usage Dashboard
   - Admin access control
   - KPI cards display
   - Date range filtering
   - Charts rendering
   - Events table and pagination
   - Data export
   - Alert management

2. **backlog.spec.ts** - Tests for Backlog Screen
   - Sprint creation and display
   - Work item CRUD operations
   - Drag-and-drop sprint assignment
   - Backlog visibility logic
   - Sprint expand/collapse
   - Search filtering

3. **kanban.spec.ts** - Tests for Kanban Board
   - Active sprint filtering
   - Drag-and-drop status changes
   - Empty state handling
   - Work item details modal
   - Assignee filtering
   - Column card counts

## Setup

Install Playwright and browsers:

```bash
npm install -D @playwright/test
npx playwright install
```

## Environment Variables

Create a `.env.test` file with:

```env
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=password123
TEST_USER_EMAIL=user@test.com
TEST_USER_PASSWORD=password123
TEST_PROJECT_ID=your-test-project-id
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/usage-dashboard.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

## Writing New Tests

Follow these patterns:

1. **Use data-testid attributes** in components for stable selectors
2. **Wait for network idle** before assertions
3. **Handle optional elements** with conditional checks
4. **Clean up test data** in afterEach hooks if needed
5. **Use descriptive test names** that explain what is being tested

## CI/CD Integration

Tests can be integrated into CI pipeline:

```yaml
- name: Run E2E Tests
  run: npx playwright test
  env:
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
```

## Debugging Tests

```bash
# Debug specific test
npx playwright test --debug usage-dashboard.spec.ts

# Run with Visual Studio Code extension
# Install Playwright extension for better debugging
```

## Common Issues

1. **Timeouts**: Increase timeout in playwright.config.ts
2. **Flaky tests**: Add proper wait conditions
3. **Selector changes**: Use data-testid instead of text selectors
4. **Authentication**: Ensure test users exist in Appwrite
