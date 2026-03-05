import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const key = process.env.NEXT_APPWRITE_KEY;

if (!endpoint || !project || !key) {
    console.error('❌ Missing required environment variables:');
    if (!endpoint) console.error('   - NEXT_PUBLIC_APPWRITE_ENDPOINT');
    if (!project) console.error('   - NEXT_PUBLIC_APPWRITE_PROJECT');
    if (!key) console.error('   - NEXT_APPWRITE_KEY');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(key);

const databases = new Databases(client);

export { client, databases };
