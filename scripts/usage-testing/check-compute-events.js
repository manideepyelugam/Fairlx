/**
 * Check recent usage events for compute operations (work items)
 */

const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);

async function checkUsageEvents() {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const USAGE_EVENTS_ID = process.env.NEXT_PUBLIC_APPWRITE_USAGE_EVENTS_ID;

    console.log('📊 Checking Usage Events...\n');

    // Get all recent events
    const allEvents = await databases.listDocuments(DATABASE_ID, USAGE_EVENTS_ID, [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
    ]);

    console.log(`Total events: ${allEvents.total}\n`);

    // Filter by resource type
    const trafficEvents = allEvents.documents.filter(e => e.resourceType === 'traffic');
    const computeEvents = allEvents.documents.filter(e => e.resourceType === 'compute');
    const storageEvents = allEvents.documents.filter(e => e.resourceType === 'storage');

    console.log(`Traffic events: ${trafficEvents.length}`);
    console.log(`Compute events: ${computeEvents.length} ⚠️ (should have work item operations)`);
    console.log(`Storage events: ${storageEvents.length}\n`);

    if (computeEvents.length > 0) {
        console.log('Latest compute events:');
        computeEvents.slice(0, 5).forEach(e => {
            const meta = e.metadata ? JSON.parse(e.metadata) : {};
            console.log(`  - ${e.source} | ${meta.jobType || 'unknown'} | ${e.units} units | ${new Date(e.$createdAt).toLocaleString()}`);
        });
    } else {
        console.log('❌ No compute events found!');
        console.log('   This means work item metering is NOT being logged.\n');
        console.log('💡 Possible causes:');
        console.log('   1. Metering code isn\'t being executed');
        console.log('   2. Metering calls are failing silently');
        console.log('   3. Server hasn\'t been restarted after code changes\n');
    }

    // Check workspaces
    const workspaces = new Set(allEvents.documents.map(e => e.workspaceId));
    console.log(`\nWorkspaces with usage: ${Array.from(workspaces).join(', ')}`);
}

checkUsageEvents().catch(console.error);
