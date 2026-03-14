require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY); 

const databases = new Databases(client);

async function checkSchema() {
    try {
        const collections = ['project_docs', 'workItems', 'github_repositories', 'code_documentation'];
        for (const col of collections) {
            try {
                const result = await databases.getCollection(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID, col);
                console.log(`Collection: ${col}`);
                console.log(`Attributes: ${result.attributes.map(a => a.key).join(', ')}`);
            } catch (e) {
                console.log(`Collection ${col} not found or error: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
