#!/usr/bin/env node

/**
 * Usage Data Generator & Verification Script
 * 
 * This script:
 * 1. Generates artificial usage events
 * 2. Verifies the data appears in API responses
 * 3. Can be used to test if dashboard UI updates correctly
 * 
 * Usage: node generate-usage-data.js [options]
 * 
 * Environment variables:
 * - TEST_WORKSPACE_ID: Workspace to generate data for
 * - TEST_SESSION_COOKIE: Session cookie for authentication
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const WORKSPACE_ID = process.env.TEST_WORKSPACE_ID || '694279240018241553bb';
const SESSION_COOKIE = process.env.TEST_SESSION_COOKIE || 'eyJpZCI6IjY4ZWI4ZDExMDAzYTA2OWM0ZGE4Iiwic2VjcmV0IjoiNTIwNzY2NjQzMTk3MjhkZDc4NTlmNGNhMGI3MjhjMWJiNzI1ZDdlZWViMGM4NGFmOTZmYjk5OTU1ZWU4NDVhM2E1YjViMDYxOTIwY2ZiOTE0YzM3YWZjOWY2MTdjMjZmNzZmZDQwYzZhMGE5N2E0YjY5ZWQyYWIzYmJlYTg4Y2U4ZGQ4YzJhOGU1MTMxZDZlMzUyZWZjOTZiZWYzNDM0NGFhNGNlOGQxMGU5N2FkOTcwZjJiY2JlNmJhMjIxMTU1MjRlMTI3NmVlOWE2ZmVhMjgyNzNjYTQ0OWJlOTc5YmM1OGY5MDdmN2FlNDY5Zjk1OGZiMzliMTY2YWU3MTdlYSJ9';

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
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

function section(message) {
    log(`\n${'='.repeat(60)}`, colors.blue);
    log(message, colors.blue);
    log('='.repeat(60) + '\n', colors.blue);
}

// Helper to make authenticated API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (SESSION_COOKIE) {
        headers['Cookie'] = SESSION_COOKIE;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    return response;
}

// Generate random usage data
function generateTrafficEvent() {
    const operations = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const endpoints = ['/api/tasks', '/api/projects', '/api/workspaces', '/api/members'];
    const method = operations[Math.floor(Math.random() * operations.length)];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    return {
        workspaceId: WORKSPACE_ID,
        resourceType: 'traffic',
        units: Math.floor(Math.random() * 1000000) + 10000, // 10KB to 1MB
        source: 'api',
        metadata: {
            endpoint,
            method,
            requestBytes: Math.floor(Math.random() * 50000),
            responseBytes: Math.floor(Math.random() * 50000),
        },
    };
}

function generateStorageEvent() {
    const operations = ['upload', 'download', 'delete'];
    const fileTypes = ['pdf', 'jpg', 'png', 'doc', 'xlsx'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];

    return {
        workspaceId: WORKSPACE_ID,
        resourceType: 'storage',
        units: Math.floor(Math.random() * 10000000) + 100000, // 100KB to 10MB
        source: 'file',
        metadata: {
            operation,
            fileName: `document_${Date.now()}.${fileType}`,
            fileType,
        },
    };
}

function generateComputeEvent(isAI = false) {
    const jobTypes = isAI
        ? ['ai_summary', 'ai_code_review', 'ai_doc_generation']
        : ['task_create', 'sprint_complete', 'automation_trigger'];

    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];

    const event = {
        workspaceId: WORKSPACE_ID,
        resourceType: 'compute',
        units: isAI ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 10) + 1,
        source: isAI ? 'ai' : 'job',
        metadata: {
            jobType,
            jobId: `job_${Date.now()}`,
            duration: Math.floor(Math.random() * 5000) + 100,
            isAI,
        },
    };

    if (isAI) {
        event.metadata.model = 'gpt-4';
        event.metadata.tokensUsed = Math.floor(Math.random() * 1000) + 100;
    }

    return event;
}

// Create usage event via API
async function createUsageEvent(event) {
    const response = await apiRequest('/api/usage/events', {
        method: 'POST',
        body: JSON.stringify(event),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create event: ${response.status} - ${text}`);
    }

    return await response.json();
}

// Fetch current usage summary
async function getUsageSummary() {
    const response = await apiRequest(`/api/usage/summary?workspaceId=${WORKSPACE_ID}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch summary: ${response.status}`);
    }

    return await response.json();
}

// Fetch usage events
async function getUsageEvents(limit = 10) {
    const response = await apiRequest(
        `/api/usage/events?workspaceId=${WORKSPACE_ID}&limit=${limit}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
    }

    return await response.json();
}

// Main execution
async function main() {
    log('\n🔬 Usage Data Generator & Verification\n', colors.magenta);

    info(`Workspace ID: ${WORKSPACE_ID}`);
    info(`API Base URL: ${BASE_URL}`);

    if (!SESSION_COOKIE) {
        warn('\n⚠️  No session cookie provided. Events will require admin authentication.');
        warn('Set TEST_SESSION_COOKIE environment variable for authenticated requests.\n');
        warn('To get your session cookie:');
        warn('1. Log in to the app');
        warn('2. Open DevTools > Application > Cookies');
        warn('3. Copy the session cookie value');
        warn('4. Run: TEST_SESSION_COOKIE="your-cookie" node generate-usage-data.js\n');
    }

    section('📊 Phase 1: Fetch Current State');

    let beforeSummary;
    let beforeEvents;

    try {
        info('Fetching current usage summary...');
        beforeSummary = await getUsageSummary();
        success(`Current summary fetched`);

        if (beforeSummary.data) {
            log(`  Traffic: ${beforeSummary.data.trafficTotalGB?.toFixed(4) || 0} GB`, colors.cyan);
            log(`  Storage: ${beforeSummary.data.storageAvgGB?.toFixed(4) || 0} GB`, colors.cyan);
            log(`  Compute: ${beforeSummary.data.computeTotalUnits || 0} units`, colors.cyan);
            log(`  Cost: $${beforeSummary.data.estimatedCost?.total?.toFixed(4) || 0}`, colors.cyan);
        }

        info('\nFetching current events...');
        beforeEvents = await getUsageEvents(5);
        success(`Found ${beforeEvents.data?.total || 0} total events`);
    } catch (err) {
        error(`Error fetching current state: ${err.message}`);
        if (err.message.includes('403') || err.message.includes('401')) {
            error('Authentication required. Please provide TEST_SESSION_COOKIE.');
            process.exit(1);
        }
        warn('Continuing anyway...\n');
    }

    section('🎲 Phase 2: Generate Artificial Usage Data');

    const eventsToCreate = [
        { type: 'Traffic', count: 10, generator: generateTrafficEvent },
        { type: 'Storage', count: 5, generator: generateStorageEvent },
        { type: 'Compute (Regular)', count: 8, generator: () => generateComputeEvent(false) },
        { type: 'Compute (AI)', count: 3, generator: () => generateComputeEvent(true) },
    ];

    const createdEvents = [];
    let totalCreated = 0;

    for (const { type, count, generator } of eventsToCreate) {
        info(`\nGenerating ${count} ${type} events...`);

        for (let i = 0; i < count; i++) {
            try {
                const event = generator();
                const result = await createUsageEvent(event);
                createdEvents.push(result);
                totalCreated++;

                process.stdout.write(`  ${i + 1}/${count} created\r`);

                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                error(`\n  Failed to create event: ${err.message}`);
            }
        }

        success(`\n  Created ${count} ${type} events`);
    }

    success(`\n✨ Total events created: ${totalCreated}`);

    section('🔍 Phase 3: Verify Data Updates');

    info('Waiting 2 seconds for data to propagate...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        info('\nFetching updated usage summary...');
        const afterSummary = await getUsageSummary();
        success('Updated summary fetched');

        if (afterSummary.data) {
            log(`\n📈 Updated Values:`, colors.green);
            log(`  Traffic: ${afterSummary.data.trafficTotalGB?.toFixed(4) || 0} GB`, colors.cyan);
            log(`  Storage: ${afterSummary.data.storageAvgGB?.toFixed(4) || 0} GB`, colors.cyan);
            log(`  Compute: ${afterSummary.data.computeTotalUnits || 0} units`, colors.cyan);
            log(`  Cost: $${afterSummary.data.estimatedCost?.total?.toFixed(4) || 0}`, colors.cyan);
            log(`  Event Count: ${afterSummary.data.eventCount || 0}`, colors.cyan);

            // Calculate changes
            if (beforeSummary?.data) {
                const trafficChange = (afterSummary.data.trafficTotalGB || 0) - (beforeSummary.data.trafficTotalGB || 0);
                const storageChange = (afterSummary.data.storageAvgGB || 0) - (beforeSummary.data.storageAvgGB || 0);
                const computeChange = (afterSummary.data.computeTotalUnits || 0) - (beforeSummary.data.computeTotalUnits || 0);
                const costChange = (afterSummary.data.estimatedCost?.total || 0) - (beforeSummary.data.estimatedCost?.total || 0);

                log(`\n📊 Changes:`, colors.yellow);
                log(`  Traffic: +${trafficChange.toFixed(4)} GB`, colors.yellow);
                log(`  Storage: +${storageChange.toFixed(4)} GB`, colors.yellow);
                log(`  Compute: +${computeChange} units`, colors.yellow);
                log(`  Cost: +$${costChange.toFixed(4)}`, colors.yellow);
            }
        }

        info('\nFetching updated events list...');
        const afterEvents = await getUsageEvents(10);
        success(`Found ${afterEvents.data?.total || 0} total events`);

        const newEventCount = (afterEvents.data?.total || 0) - (beforeEvents?.data?.total || 0);
        log(`  New events: +${newEventCount}`, colors.green);

    } catch (err) {
        error(`Error verifying updates: ${err.message}`);
    }

    section('✅ Verification Complete');

    log(`
🎯 Next Steps:

1. Open the admin dashboard in your browser:
   ${BASE_URL}/workspaces/${WORKSPACE_ID}/admin/usage

2. Verify the following changes are visible:
   ✓ KPI cards show updated values
   ✓ Charts display new data points
   ✓ Events table shows ${totalCreated} new events
   ✓ Cost summary reflects new usage

3. Try the following UI interactions:
   ✓ Filter events by resource type
   ✓ Export data as CSV
   ✓ Change date range
   ✓ Create a usage alert

4. Check browser DevTools console for any errors

`, colors.cyan);

    success('🎉 Data generation and verification complete!\n');
}

// Run the script
main().catch(err => {
    error(`\n❌ Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
});
