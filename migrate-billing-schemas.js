require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function fixBillingSchemas() {
    console.log('Starting billing schema migration...');

    // 1. Fix usage_events
    const usageEventsId = process.env.NEXT_PUBLIC_APPWRITE_USAGE_EVENTS_ID || 'usage_events';
    console.log(`Fixing ${usageEventsId}...`);
    try {
        const attributes = [
            { key: 'resourceType', type: 'string', size: 64, required: true },
            { key: 'units', type: 'float', required: true },
            { key: 'projectId', type: 'string', size: 256, required: false },
            { key: 'module', type: 'string', size: 64, required: false },
            { key: 'ownerType', type: 'string', size: 32, required: false },
            { key: 'ownerId', type: 'string', size: 256, required: false },
            { key: 'billingEntityId', type: 'string', size: 256, required: false },
            { key: 'billingEntityType', type: 'string', size: 32, required: false },
            { key: 'idempotencyKey', type: 'string', size: 256, required: false }, // Critical for tracking
        ];

        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(databaseId, usageEventsId, attr.key, attr.size, attr.required, attr.default, attr.array);
                } else if (attr.type === 'float') {
                    await databases.createFloatAttribute(databaseId, usageEventsId, attr.key, attr.required, 0, 1000000000000, attr.default, attr.array);
                }
                console.log(`Created attribute ${attr.key} in ${usageEventsId}`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`Attribute ${attr.key} already exists in ${usageEventsId}`);
                } else {
                    console.error(`Error creating attribute ${attr.key} in ${usageEventsId}:`, e.message);
                }
            }
        }
    } catch (e) {
        console.error(`Failed to process ${usageEventsId}:`, e.message);
    }

    // 2. Fix usage_aggregations
    const usageAggId = process.env.NEXT_PUBLIC_APPWRITE_USAGE_AGGREGATIONS_ID || 'usage_aggregations';
    console.log(`Fixing ${usageAggId}...`);
    try {
        const attributes = [
            { key: 'trafficTotalGB', type: 'float', required: true, default: 0 },
            { key: 'storageAvgGB', type: 'float', required: true, default: 0 },
            { key: 'computeTotalUnits', type: 'float', required: true, default: 0 },
            { key: 'isFinalized', type: 'boolean', required: false, default: false },
        ];

        for (const attr of attributes) {
            try {
                if (attr.type === 'float') {
                    await databases.createFloatAttribute(databaseId, usageAggId, attr.key, attr.required, 0, 1000000, attr.default);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(databaseId, usageAggId, attr.key, attr.required, attr.default);
                }
                console.log(`Created attribute ${attr.key} in ${usageAggId}`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`Attribute ${attr.key} already exists in ${usageAggId}`);
                } else {
                    console.error(`Error creating attribute ${attr.key} in ${usageAggId}:`, e.message);
                }
            }
        }
    } catch (e) {
        console.error(`Failed to process ${usageAggId}:`, e.message);
    }

    console.log('Billing schema migration completed.');
}

fixBillingSchemas();
