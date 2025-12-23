/**
 * Quick diagnostic script to test usage metering
 * Run this to verify Appwrite collections and permissions are configured
 */

const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USAGE_EVENTS_ID = process.env.NEXT_PUBLIC_APPWRITE_USAGE_EVENTS_ID;

async function testMeteringIntegration() {
    console.log('🔍 Testing Usage Metering Integration...\n');

    // Test 1: Check if usage_events collection exists
    console.log('Test 1: Checking collection exists...');
    try {
        const events = await databases.listDocuments(DATABASE_ID, USAGE_EVENTS_ID);
        console.log(`✅ Collection exists with ${events.total} events\n`);
    } catch (error) {
        console.error('❌ Cannot access collection:', error.message);
        console.log('   Fix: Create the collection in Appwrite Console\n');
        return;
    }

    // Test 2: Try to create a test event
    console.log('Test 2: Creating test usage event...');
    try {
        const testEvent = await databases.createDocument(
            DATABASE_ID,
            USAGE_EVENTS_ID,
            ID.unique(),
            {
                workspaceId: 'test-workspace',
                projectId: 'test-project',
                resourceType: 'COMPUTE',
                units: 1,
                metadata: JSON.stringify({ test: true }),
                timestamp: new Date().toISOString(),
                source: 'JOB',
            }
        );
        console.log(`✅ Test event created: ${testEvent.$id}\n`);

        // Clean up
        await databases.deleteDocument(DATABASE_ID, USAGE_EVENTS_ID, testEvent.$id);
        console.log('✅ Test event cleaned up\n');
    } catch (error) {
        console.error('❌ Cannot create event:', error.message);
        console.error('   Error type:', error.type);
        console.log('\n   Fix: Set collection permissions:');
        console.log('   1. Go to Appwrite Console > Databases > usage_events');
        console.log('   2. Settings > Permissions');
        console.log('   3. Add role: "Any" with Create, Read, Update, Delete');
        console.log('   OR use role: "Users" for authenticated users only\n');
        return;
    }

    console.log('✅ All tests passed! Usage metering is configured correctly.\n');
    console.log('💡 If usage still not showing:');
    console.log('   1. Check server logs for "[UsageMetering]" errors');
    console.log('   2. Create a work item and check if event appears');
    console.log('   3. Verify workspaceId in admin panel matches work item workspace\n');
}

testMeteringIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
