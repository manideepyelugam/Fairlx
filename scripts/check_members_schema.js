const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const API_KEY = process.env.NEXT_APPWRITE_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID;

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID || !MEMBERS_ID) {
    console.error("Missing Environment Variables");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function checkSchema() {
    try {
        const response = await databases.listAttributes(DATABASE_ID, MEMBERS_ID);
        const roleAttr = response.attributes.find(a => a.key === 'role');

        if (roleAttr) {
            console.log("Role Attribute Found:");
            console.log(JSON.stringify(roleAttr, null, 2));
        } else {
            console.log("Role attribute NOT found.");
        }
    } catch (error) {
        console.error("Error fetching schema:", error);
    }
}

checkSchema();
