/**
 * Production Hardening Schema Migration
 * 
 * Adds the required fields and collections for production hardening:
 * 
 * 1. billing_accounts: Add isBillingCycleLocked, billingCycleLockedAt
 * 2. processed_events: New collection for database-backed idempotency
 * 3. usage_aggregations: Add isFinalized, finalizedAt
 * 
 * Usage:
 *   node scripts/production-hardening-migration.js
 */

require('dotenv').config({ path: '.env.local' });

const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

/**
 * Add cycle locking fields to billing_accounts
 */
async function addBillingAccountAttributes() {
    console.log('\n=== Adding billing_accounts attributes ===');

    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_BILLING_ACCOUNTS_ID;

    if (!collectionId) {
        console.log('ERROR: NEXT_PUBLIC_APPWRITE_BILLING_ACCOUNTS_ID not set');
        console.log('Please run create-billing-collections.js first');
        return false;
    }

    const attributes = [
        { key: 'isBillingCycleLocked', type: 'boolean', required: false, default: false },
        { key: 'billingCycleLockedAt', type: 'datetime', required: false },
    ];

    for (const attr of attributes) {
        try {
            if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.required,
                    attr.default
                );
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.required
                );
            }
            console.log(`  ✓ Created attribute: ${attr.key}`);
        } catch (e) {
            if (e.message.includes('already exists') || e.code === 409) {
                console.log(`  ⏭ Attribute ${attr.key} already exists, skipping`);
            } else {
                console.log(`  ✗ Failed to create ${attr.key}: ${e.message}`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
}

/**
 * Create processed_events collection for idempotency tracking
 */
async function createProcessedEventsCollection() {
    console.log('\n=== Creating processed_events collection ===');

    let collectionId;

    try {
        const collection = await databases.createCollection(
            databaseId,
            ID.unique(),
            'processed_events',
            []
        );

        collectionId = collection.$id;
        console.log(`  ✓ Created collection: ${collectionId}`);
    } catch (e) {
        if (e.message.includes('already exists') || e.code === 409) {
            console.log('  ⏭ Collection already exists, trying to get ID...');
            // Collection exists - try to list collections to find it
            try {
                const collections = await databases.listCollections(databaseId);
                const existing = collections.collections.find(c => c.name === 'processed_events');
                if (existing) {
                    collectionId = existing.$id;
                    console.log(`  ✓ Found existing collection: ${collectionId}`);
                } else {
                    console.log('  ✗ Could not find processed_events collection');
                    return null;
                }
            } catch (listError) {
                console.log(`  ✗ Error listing collections: ${listError.message}`);
                return null;
            }
        } else {
            console.log(`  ✗ Error creating collection: ${e.message}`);
            return null;
        }
    }

    // Create attributes
    const attributes = [
        { key: 'eventId', type: 'string', size: 255, required: true },
        { key: 'eventType', type: 'string', size: 20, required: true },
        { key: 'processedAt', type: 'datetime', required: true },
        { key: 'metadata', type: 'string', size: 10000, required: false },
    ];

    for (const attr of attributes) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.size,
                    attr.required
                );
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.required
                );
            }
            console.log(`  ✓ Created attribute: ${attr.key}`);
        } catch (e) {
            if (e.message.includes('already exists') || e.code === 409) {
                console.log(`  ⏭ Attribute ${attr.key} already exists`);
            } else {
                console.log(`  ✗ Failed to create ${attr.key}: ${e.message}`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create unique index on eventId
    console.log('  Creating indexes...');
    try {
        await databases.createIndex(
            databaseId,
            collectionId,
            'eventId_unique',
            'unique',
            ['eventId']
        );
        console.log('  ✓ Created unique index: eventId_unique');
    } catch (e) {
        if (e.message.includes('already exists') || e.code === 409) {
            console.log('  ⏭ Index already exists');
        } else {
            console.log(`  ✗ Failed to create index: ${e.message}`);
        }
    }

    try {
        await databases.createIndex(
            databaseId,
            collectionId,
            'eventType_idx',
            'key',
            ['eventType']
        );
        console.log('  ✓ Created index: eventType_idx');
    } catch (e) {
        if (e.message.includes('already exists') || e.code === 409) {
            console.log('  ⏭ Index already exists');
        } else {
            console.log(`  ✗ Failed to create index: ${e.message}`);
        }
    }

    console.log(`\n  Add to .env.local:\n  NEXT_PUBLIC_APPWRITE_PROCESSED_EVENTS_ID=${collectionId}`);
    return collectionId;
}

/**
 * Add finalization fields to usage_aggregations
 */
async function addUsageAggregationsAttributes() {
    console.log('\n=== Adding usage_aggregations attributes ===');

    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_USAGE_AGGREGATIONS_ID;

    if (!collectionId) {
        console.log('  ⚠ NEXT_PUBLIC_APPWRITE_USAGE_AGGREGATIONS_ID not set, skipping');
        return false;
    }

    const attributes = [
        { key: 'isFinalized', type: 'boolean', required: false, default: false },
        { key: 'finalizedAt', type: 'datetime', required: false },
        { key: 'billingEntityId', type: 'string', size: 36, required: false },
    ];

    for (const attr of attributes) {
        try {
            if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.required,
                    attr.default
                );
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.required
                );
            } else if (attr.type === 'string') {
                await databases.createStringAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.size,
                    attr.required
                );
            }
            console.log(`  ✓ Created attribute: ${attr.key}`);
        } catch (e) {
            if (e.message.includes('already exists') || e.code === 409) {
                console.log(`  ⏭ Attribute ${attr.key} already exists`);
            } else {
                console.log(`  ✗ Failed to create ${attr.key}: ${e.message}`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create index for finalized query
    try {
        await databases.createIndex(
            databaseId,
            collectionId,
            'isFinalized_idx',
            'key',
            ['isFinalized']
        );
        console.log('  ✓ Created index: isFinalized_idx');
    } catch (e) {
        if (e.message.includes('already exists') || e.code === 409) {
            console.log('  ⏭ Index already exists');
        } else {
            console.log(`  ✗ Failed to create index: ${e.message}`);
        }
    }

    return true;
}

/**
 * Add aggregationSnapshotId to invoices
 */
async function addInvoiceSnapshotAttribute() {
    console.log('\n=== Adding invoices aggregation snapshot reference ===');

    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_INVOICES_ID;

    if (!collectionId) {
        console.log('  ⚠ NEXT_PUBLIC_APPWRITE_INVOICES_ID not set, skipping');
        return false;
    }

    try {
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'aggregationSnapshotId',
            36,
            false
        );
        console.log('  ✓ Created attribute: aggregationSnapshotId');
    } catch (e) {
        if (e.message.includes('already exists') || e.code === 409) {
            console.log('  ⏭ Attribute aggregationSnapshotId already exists');
        } else {
            console.log(`  ✗ Failed to create aggregationSnapshotId: ${e.message}`);
        }
    }

    return true;
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          PRODUCTION HARDENING SCHEMA MIGRATION             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log(`\nDatabase: ${databaseId}`);
    console.log(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);

    try {
        // 1. Add billing account cycle lock fields
        await addBillingAccountAttributes();

        // 2. Create processed_events collection
        const processedEventsId = await createProcessedEventsCollection();

        // 3. Add usage_aggregations fields
        await addUsageAggregationsAttributes();

        // 4. Add invoice snapshot reference
        await addInvoiceSnapshotAttribute();

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                    MIGRATION COMPLETE                       ║');
        console.log('╚════════════════════════════════════════════════════════════╝');

        if (processedEventsId) {
            console.log('\n⚠ ACTION REQUIRED: Add this to your .env.local:');
            console.log(`   NEXT_PUBLIC_APPWRITE_PROCESSED_EVENTS_ID=${processedEventsId}`);
        }

        console.log('\n✓ Schema is now ready for production hardening features');

    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        process.exit(1);
    }
}

main();
