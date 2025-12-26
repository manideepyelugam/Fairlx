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
        console.log(`Adding organizationId attribute to workspaces collection [${WORKSPACES_ID}] in database [${DATABASE_ID}]...`);
        await databases.createStringAttribute(
            DATABASE_ID,
            WORKSPACES_ID,
            'organizationId',
            50,
            false // required = false
        );
        console.log('Attribute added successfully.');
    } catch (error) {
        console.error('Error adding attribute:', error);
    }
}

migrate();
