#!/usr/bin/env node

/**
 * Usage Billing Dashboard API Test Script
 * 
 * This script tests the usage billing API endpoints to ensure they work correctly.
 * Run with: node test-usage-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
    log(`✓ ${message}`, colors.green);
}

function error(message) {
    log(`✗ ${message}`, colors.red);
}

function info(message) {
    log(`ℹ ${message}`, colors.cyan);
}

function warn(message) {
    log(`⚠ ${message}`, colors.yellow);
}

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    tests: [],
};

async function test(name, fn) {
    try {
        await fn();
        results.passed++;
        results.tests.push({ name, passed: true });
        success(name);
    } catch (err) {
        results.failed++;
        results.tests.push({ name, passed: false, error: err.message });
        error(`${name}: ${err.message}`);
    }
}

// Helper to make API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok && response.status !== 403) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
}

// Main test suite
async function runTests() {
    log('\n🧪 Usage Billing Dashboard API Tests\n', colors.blue);
    log('='.repeat(50), colors.blue);

    const workspaceId = process.env.TEST_WORKSPACE_ID || 'test-workspace-id';

    info(`Testing with workspace ID: ${workspaceId}`);
    info(`API Base URL: ${BASE_URL}\n`);

    // Test 1: Check if usage routes are registered
    await test('API routes are registered', async () => {
        const response = await apiRequest('/api/usage/summary', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // We expect 401/403 if not authenticated, but not 404
        if (response.status === 404) {
            throw new Error('Usage API routes not found - routes may not be registered');
        }
    });

    // Test 2: Check usage events endpoint structure
    await test('Usage events endpoint exists', async () => {
        const response = await apiRequest(`/api/usage/events?workspaceId=${workspaceId}`);

        if (response.status === 404) {
            throw new Error('Events endpoint not found');
        }

        // 401/403 is expected without auth
        if (response.status !== 401 && response.status !== 403 && response.status !== 200) {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    });

    // Test 3: Check usage summary endpoint
    await test('Usage summary endpoint exists', async () => {
        const response = await apiRequest(`/api/usage/summary?workspaceId=${workspaceId}`);

        if (response.status === 404) {
            throw new Error('Summary endpoint not found');
        }
    });

    // Test 4: Check usage alerts endpoint
    await test('Usage alerts endpoint exists', async () => {
        const response = await apiRequest(`/api/usage/alerts?workspaceId=${workspaceId}`);

        if (response.status === 404) {
            throw new Error('Alerts endpoint not found');
        }
    });

    // Test 5: Check usage aggregations endpoint
    await test('Usage aggregations endpoint exists', async () => {
        const response = await apiRequest(`/api/usage/aggregations?workspaceId=${workspaceId}`);

        if (response.status === 404) {
            throw new Error('Aggregations endpoint not found');
        }
    });

    // Test 6: Check export endpoint
    await test('Usage export endpoint exists', async () => {
        const response = await apiRequest(`/api/usage/events/export?workspaceId=${workspaceId}&format=json`);

        if (response.status === 404) {
            throw new Error('Export endpoint not found');
        }
    });

    // Test 7: Admin page route
    await test('Admin usage page exists', async () => {
        const response = await fetch(`${BASE_URL}/workspaces/${workspaceId}/admin/usage`, {
            redirect: 'manual',
        });

        // We expect either 200 (loaded) or 307/302 (redirect to login)
        if (response.status === 404) {
            throw new Error('Admin usage page not found');
        }

        if (![200, 302, 307].includes(response.status)) {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    });

    // Print summary
    log('\n' + '='.repeat(50), colors.blue);
    log('\n📊 Test Summary\n', colors.blue);

    log(`Total Tests: ${results.passed + results.failed}`);
    success(`Passed: ${results.passed}`);

    if (results.failed > 0) {
        error(`Failed: ${results.failed}`);
        log('\nFailed Tests:', colors.yellow);
        results.tests
            .filter(t => !t.passed)
            .forEach(t => {
                error(`  - ${t.name}`);
                log(`    Error: ${t.error}`, colors.red);
            });
    }

    log('\n' + '='.repeat(50), colors.blue);

    if (results.failed === 0) {
        success('\n🎉 All tests passed!\n');
    } else {
        warn('\n⚠️  Some tests failed. Please review the errors above.\n');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(err => {
    error(`\nFatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
});
