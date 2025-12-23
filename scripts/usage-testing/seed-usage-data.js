/**
 * Generate usage data for a specific workspace
 * Run: node seed-usage-data.js <workspaceId>
 */

const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const WORKSPACE_ID = process.argv[2] || '694279240018241553bb';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USAGE_EVENTS_ID = process.env.NEXT_PUBLIC_APPWRITE_USAGE_EVENTS_ID;

async function seedUsageData() {
    console.log(`🌱 Seeding usage data for workspace: ${WORKSPACE_ID}\n`);

    const now = new Date();
    const events = [];

    // Generate 20 events over the past week
    for (let i = 0; i < 20; i++) {
        const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const types = ['traffic', 'storage', 'compute'];
        const sources = ['api', 'file', 'job', 'ai'];
        const resourceType = types[Math.floor(Math.random() * types.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];

        let units;
        let metadata = {};

        switch (resourceType) {
            case 'traffic':
                units = Math.floor(Math.random() * 500000) + 1000;
                metadata = { endpoint: '/api/work-items', method: 'POST', requestBytes: units / 2, responseBytes: units / 2 };
                break;
            case 'storage':
                units = Math.floor(Math.random() * 10000000) + 100000;
                metadata = { operation: 'upload', fileName: 'document.pdf', fileType: 'application/pdf' };
                break;
            case 'compute':
                units = Math.floor(Math.random() * 10) + 1;
                metadata = { jobType: 'task_create', isAI: source === 'ai' };
                break;
        }

        try {
            const event = await databases.createDocument(
                DATABASE_ID,
                USAGE_EVENTS_ID,
                ID.unique(),
                {
                    workspaceId: WORKSPACE_ID,
                    projectId: null,
                    resourceType,
                    units,
                    metadata: JSON.stringify(metadata),
                    timestamp: timestamp.toISOString(),
                    source,
                }
            );
            events.push(event);
            process.stdout.write('.');
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    console.log(`\n\n✅ Created ${events.length} usage events for workspace ${WORKSPACE_ID}`);
    console.log('\n📊 Now refresh your Admin Panel > Usage page!');
}

seedUsageData().catch(console.error);
