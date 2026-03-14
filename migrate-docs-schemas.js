require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function fixSchemas() {
    console.log('Starting schema migration...');

    // 1. Fix project_docs
    const projectDocsId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_DOCS_ID || 'project_docs';
    console.log(`Fixing ${projectDocsId}...`);
    try {
        const attributes = [
            { key: 'name', type: 'string', size: 512, required: true },
            { key: 'category', type: 'string', size: 128, required: true },
            { key: 'size', type: 'integer', required: true },
            { key: 'isArchived', type: 'boolean', required: false, default: false },
            { key: 'version', type: 'string', size: 64, required: false, default: '1.0.0' },
            { key: 'tags', type: 'string', size: 256, required: false, array: true },
        ];

        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(databaseId, projectDocsId, attr.key, attr.size, attr.required, attr.default, attr.array);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(databaseId, projectDocsId, attr.key, attr.required, 0, 1000000000, attr.default, attr.array);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(databaseId, projectDocsId, attr.key, attr.required, attr.default, attr.array);
                }
                console.log(`Created attribute ${attr.key} in ${projectDocsId}`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`Attribute ${attr.key} already exists in ${projectDocsId}`);
                } else {
                    console.error(`Error creating attribute ${attr.key} in ${projectDocsId}:`, e.message);
                }
            }
        }
    } catch (e) {
        console.error(`Failed to process ${projectDocsId}:`, e.message);
    }

    // 2. Fix code_documentation
    const codeDocsId = process.env.NEXT_PUBLIC_APPWRITE_CODE_DOCS_ID || 'code_documentation';
    console.log(`Fixing ${codeDocsId}...`);
    try {
        const attributes = [
            { key: 'content', type: 'string', size: 65535, required: true },
            { key: 'generatedAt', type: 'string', size: 128, required: true },
            { key: 'fileStructure', type: 'string', size: 65535, required: false },
            { key: 'mermaidDiagram', type: 'string', size: 65535, required: false },
        ];

        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(databaseId, codeDocsId, attr.key, attr.size, attr.required, attr.default, attr.array);
                }
                console.log(`Created attribute ${attr.key} in ${codeDocsId}`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`Attribute ${attr.key} already exists in ${codeDocsId}`);
                } else {
                    console.error(`Error creating attribute ${attr.key} in ${codeDocsId}:`, e.message);
                }
            }
        }

        // Also update filePath to be optional if it was required
        try {
            await databases.updateStringAttribute(databaseId, codeDocsId, 'filePath', false, null);
            console.log(`Updated filePath to be optional in ${codeDocsId}`);
        } catch (e) {
            console.log(`Note: Could not update filePath in ${codeDocsId}:`, e.message);
        }

    } catch (e) {
        console.error(`Failed to process ${codeDocsId}:`, e.message);
    }

    console.log('Schema migration completed.');
}

fixSchemas();
