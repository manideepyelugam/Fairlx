/**
 * Billing Collections Migration Script
 * 
 * Creates the required Appwrite collections for the billing system:
 * - billing_accounts: Core billing entity with Razorpay integration
 * - billing_audit_logs: Audit trail for all billing events
 * 
 * Also adds new fields to existing invoices collection.
 * 
 * Usage:
 *   node scripts/create-billing-collections.js
 * 
 * Requirements:
 *   - NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   - NEXT_PUBLIC_APPWRITE_PROJECT
 *   - NEXT_APPWRITE_KEY
 *   - NEXT_PUBLIC_APPWRITE_DATABASE_ID
 */

require('dotenv').config({ path: '.env.local' });

const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function createBillingAccountsCollection() {
    console.log('Creating billing_accounts collection...');

    try {
        const collection = await databases.createCollection(
            databaseId,
            ID.unique(),
            'billing_accounts',
            [
                // Any authenticated user can read their own, only admins can write
            ]
        );

        const collectionId = collection.$id;
        console.log(`Created collection: ${collectionId}`);

        // Create attributes
        const attributes = [
            { key: 'type', type: 'string', size: 20, required: true },
            { key: 'userId', type: 'string', size: 36, required: false },
            { key: 'organizationId', type: 'string', size: 36, required: false },
            { key: 'razorpayCustomerId', type: 'string', size: 255, required: true },
            // E-Mandate fields (RBI-compliant postpaid billing)
            { key: 'razorpayTokenId', type: 'string', size: 255, required: false },
            { key: 'razorpayMandateId', type: 'string', size: 255, required: false },
            { key: 'mandateMaxAmount', type: 'integer', required: false },
            { key: 'mandateStatus', type: 'string', size: 20, required: false },
            { key: 'billingStatus', type: 'string', size: 20, required: true },
            { key: 'billingCycleStart', type: 'datetime', required: true },
            { key: 'billingCycleEnd', type: 'datetime', required: true },
            { key: 'gracePeriodEnd', type: 'datetime', required: false },
            { key: 'lastPaymentAt', type: 'datetime', required: false },
            { key: 'lastPaymentFailedAt', type: 'datetime', required: false },
            { key: 'paymentMethodLast4', type: 'string', size: 4, required: false },
            { key: 'paymentMethodType', type: 'string', size: 50, required: false },
            { key: 'paymentMethodBrand', type: 'string', size: 50, required: false },
            { key: 'billingEmail', type: 'string', size: 255, required: false },
        ];

        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(
                        databaseId,
                        collectionId,
                        attr.key,
                        attr.size,
                        attr.required,
                        attr.default || null
                    );
                } else if (attr.type === 'datetime') {
                    await databases.createDatetimeAttribute(
                        databaseId,
                        collectionId,
                        attr.key,
                        attr.required
                    );
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(
                        databaseId,
                        collectionId,
                        attr.key,
                        attr.required,
                        undefined, // min
                        undefined, // max
                        undefined  // default
                    );
                }
                console.log(`  Created attribute: ${attr.key}`);
            } catch (e) {
                console.log(`  Attribute ${attr.key} may already exist: ${e.message}`);
            }

            // Wait for attribute to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Create indexes
        console.log('Creating indexes...');

        try {
            await databases.createIndex(
                databaseId,
                collectionId,
                'userId_idx',
                'key',
                ['userId']
            );
            console.log('  Created index: userId_idx');
        } catch (e) {
            console.log(`  Index may already exist: ${e.message}`);
        }

        try {
            await databases.createIndex(
                databaseId,
                collectionId,
                'organizationId_idx',
                'key',
                ['organizationId']
            );
            console.log('  Created index: organizationId_idx');
        } catch (e) {
            console.log(`  Index may already exist: ${e.message}`);
        }

        try {
            await databases.createIndex(
                databaseId,
                collectionId,
                'billingStatus_idx',
                'key',
                ['billingStatus']
            );
            console.log('  Created index: billingStatus_idx');
        } catch (e) {
            console.log(`  Index may already exist: ${e.message}`);
        }

        console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_APPWRITE_BILLING_ACCOUNTS_ID=${collectionId}`);
        return collectionId;

    } catch (error) {
        console.error('Error creating billing_accounts collection:', error.message);
        throw error;
    }
}

async function createBillingAuditLogsCollection() {
    console.log('\nCreating billing_audit_logs collection...');

    try {
        const collection = await databases.createCollection(
            databaseId,
            ID.unique(),
            'billing_audit_logs',
            []
        );

        const collectionId = collection.$id;
        console.log(`Created collection: ${collectionId}`);

        // Create attributes
        const attributes = [
            { key: 'billingAccountId', type: 'string', size: 36, required: true },
            { key: 'eventType', type: 'string', size: 50, required: true },
            { key: 'metadata', type: 'string', size: 10000, required: false },
            { key: 'actorUserId', type: 'string', size: 36, required: false },
            { key: 'invoiceId', type: 'string', size: 36, required: false },
            { key: 'razorpayEventId', type: 'string', size: 255, required: false },
            { key: 'ipAddress', type: 'string', size: 45, required: false },
        ];

        for (const attr of attributes) {
            try {
                await databases.createStringAttribute(
                    databaseId,
                    collectionId,
                    attr.key,
                    attr.size,
                    attr.required
                );
                console.log(`  Created attribute: ${attr.key}`);
            } catch (e) {
                console.log(`  Attribute ${attr.key} may already exist: ${e.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Create indexes
        console.log('Creating indexes...');

        try {
            await databases.createIndex(
                databaseId,
                collectionId,
                'billingAccountId_idx',
                'key',
                ['billingAccountId']
            );
            console.log('  Created index: billingAccountId_idx');
        } catch (e) {
            console.log(`  Index may already exist: ${e.message}`);
        }

        try {
            await databases.createIndex(
                databaseId,
                collectionId,
                'eventType_idx',
                'key',
                ['eventType']
            );
            console.log('  Created index: eventType_idx');
        } catch (e) {
            console.log(`  Index may already exist: ${e.message}`);
        }

        console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_APPWRITE_BILLING_AUDIT_LOGS_ID=${collectionId}`);
        return collectionId;

    } catch (error) {
        console.error('Error creating billing_audit_logs collection:', error.message);
        throw error;
    }
}

async function addInvoiceAttributes() {
    console.log('\nAdding new attributes to invoices collection...');

    const invoicesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_INVOICES_ID;

    if (!invoicesCollectionId) {
        console.log('NEXT_PUBLIC_APPWRITE_INVOICES_ID not set, skipping invoices update');
        return;
    }

    const newAttributes = [
        { key: 'billingAccountId', type: 'string', size: 36, required: false },
        { key: 'razorpayPaymentId', type: 'string', size: 255, required: false },
        { key: 'razorpayInvoiceId', type: 'string', size: 255, required: false },
        { key: 'dueDate', type: 'datetime', required: false },
        { key: 'failureReason', type: 'string', size: 500, required: false },
        { key: 'retryCount', type: 'integer', required: false, default: 0 },
    ];

    for (const attr of newAttributes) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute(
                    databaseId,
                    invoicesCollectionId,
                    attr.key,
                    attr.size,
                    attr.required
                );
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(
                    databaseId,
                    invoicesCollectionId,
                    attr.key,
                    attr.required
                );
            } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute(
                    databaseId,
                    invoicesCollectionId,
                    attr.key,
                    attr.required,
                    undefined,
                    undefined,
                    attr.default
                );
            }
            console.log(`  Added attribute: ${attr.key}`);
        } catch (e) {
            console.log(`  Attribute ${attr.key} may already exist: ${e.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function main() {
    console.log('=== Billing Collections Migration ===\n');

    try {
        await createBillingAccountsCollection();
        await createBillingAuditLogsCollection();
        await addInvoiceAttributes();

        console.log('\n=== Migration Complete ===');
        console.log('\nRemember to:');
        console.log('1. Add the collection IDs to your .env.local file');
        console.log('2. Set up Razorpay environment variables:');
        console.log('   - RAZORPAY_KEY_ID');
        console.log('   - RAZORPAY_KEY_SECRET');
        console.log('   - RAZORPAY_WEBHOOK_SECRET');
        console.log('   - RAZORPAY_BASE_PLAN_ID (optional)');
        console.log('3. Configure Razorpay webhook endpoint in dashboard');

    } catch (error) {
        console.error('\nMigration failed:', error.message);
        process.exit(1);
    }
}

main();
