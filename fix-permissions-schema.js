const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
        .setKey(process.env.NEXT_APPWRITE_KEY);
    const db = new Databases(client);

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const PROJECT_PERMISSIONS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_PERMISSIONS_ID || 'project_permissions';

    const attrsToRemove = ['workspaceId', 'subjectType', 'subjectId', 'permissions'];
    for(const attr of attrsToRemove) {
        try {
            await db.deleteAttribute(DATABASE_ID, PROJECT_PERMISSIONS_ID, attr);
            console.log("Deleted", attr);
        } catch(e) {
            console.log("Skipped or err deleting", attr, e.message);
        }
    }

    await new Promise(r => setTimeout(r, 2000));

    const newAttrs = [
        { key: 'permissionKey', size: 256, required: true },
        { key: 'assignedToTeamId', size: 256, required: false },
        { key: 'assignedToUserId', size: 256, required: false },
        { key: 'grantedBy', size: 256, required: true },
        { key: 'grantedAt', size: 256, required: false },
    ]

    for(const attr of newAttrs) {
        try {
            await db.createStringAttribute(
                DATABASE_ID,
                PROJECT_PERMISSIONS_ID,
                attr.key,
                attr.size,
                attr.required,
                undefined,
                false,
                false
            );
            console.log("Added", attr.key);
        } catch(e) {
            console.log("Skipped or err adding", attr.key, e.message);
        }
    }
}
run();
