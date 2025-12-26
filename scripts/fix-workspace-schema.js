const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const WORKSPACES_ID = process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID;

async function migrate() {
    if (!DATABASE_ID || !WORKSPACES_ID) {
        console.error('Missing DATABASE_ID or WORKSPACES_ID in environment variables.');
        process.exit(1);
    }

    try {
        console.log(`Checking and adding attributes to workspaces collection [${WORKSPACES_ID}]...`);

        // Add billingScope
        try {
            console.log('Adding billingScope attribute...');
            await databases.createStringAttribute(
                DATABASE_ID,
                WORKSPACES_ID,
                'billingScope',
                50,
                false // required = false
            );
            console.log('billingScope added.');
        } catch (error) {
            console.log('billingScope might already exist or failed:', error.message);
        }

        // Add isDefault
        try {
            console.log('Adding isDefault attribute...');
            await databases.createBooleanAttribute(
                DATABASE_ID,
                WORKSPACES_ID,
                'isDefault',
                false // required = false
            );
            console.log('isDefault added.');
        } catch (error) {
            console.log('isDefault might already exist or failed:', error.message);
        }

        console.log('Migration attempts finished.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
