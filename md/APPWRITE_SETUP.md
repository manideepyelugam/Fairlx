# Appwrite Collections Setup for Project-Scoped RBAC

## ⚠️ IMPORTANT: Run This BEFORE Migration

You must create these two collections in Appwrite Console before running the migration script.

---

## Collection 1: `project_roles`

### Create Collection
1. Go to **Appwrite Console** → **Databases** → Your Database
2. Click **"Create Collection"**
3. Name: `project_roles`
4. Copy the Collection ID and add to `.env.local`:
   ```
   NEXT_PUBLIC_APPWRITE_PROJECT_ROLES_ID=your-collection-id-here
   ```

### Add Attributes (in order)

| Attribute Name | Type | Size | Required | Array | Default |
|----------------|------|------|----------|-------|---------|
| `workspaceId` | String | 50 | ✅ Yes | No | - |
| `projectId` | String | 50 | ✅ Yes | No | - |
| `name` | String | 50 | ✅ Yes | No | - |
| `description` | String | 200 | No | No | - |
| `permissions` | String | 50 | ✅ Yes | ✅ Yes | - |
| `color` | String | 20 | No | No | - |
| `isDefault` | Boolean | - | No | No | `false` |
| `createdBy` | String | 50 | ✅ Yes | No | - |
| `lastModifiedBy` | String | 50 | No | No | - |

### Add Indexes

| Index Key | Type | Attributes | Unique |
|-----------|------|------------|--------|
| `projectId_idx` | Key | `projectId` | No |
| `projectId_name_idx` | Unique | `projectId`, `name` | ✅ Yes |

---

## Collection 2: `project_members`

### Create Collection
1. In the same database, click **"Create Collection"** again
2. Name: `project_members`
3. Copy the Collection ID and add to `.env.local`:
   ```
   NEXT_PUBLIC_APPWRITE_PROJECT_MEMBERS_ID=your-collection-id-here
   ```

### Add Attributes (in order)

| Attribute Name | Type | Size | Required | Array | Default |
|----------------|------|------|----------|-------|---------|
| `workspaceId` | String | 50 | ✅ Yes | No | - |
| `projectId` | String | 50 | ✅ Yes | No | - |
| `teamId` | String | 50 | ✅ Yes | No | - |
| `userId` | String | 50 | ✅ Yes | No | - |
| `roleId` | String | 50 | ✅ Yes | No | - |
| `roleName` | String | 50 | No | No | - |
| `joinedAt` | String (DateTime) | 30 | No | No | - |
| `addedBy` | String | 50 | No | No | - |

### Add Indexes

| Index Key | Type | Attributes | Unique |
|-----------|------|------------|--------|
| `userId_projectId_idx` | Key | `userId`, `projectId` | No |
| `projectId_teamId_idx` | Key | `projectId`, `teamId` | No |
| `roleId_idx` | Key | `roleId` | No |
| `userId_projectId_teamId_idx` | Unique | `userId`, `projectId`, `teamId` | ✅ Yes |

---

## Optional: Add `projectId` to Existing `teams` Collection

If you want teams to be properly linked to projects, add this attribute:

1. Go to **teams** collection
2. Click **"Create Attribute"**
3. Settings:
   - Key: `projectId`
   - Type: `String`
   - Size: `50`
   - Required: **No** (for backward compatibility)
   - Array: No

---

## After Creating Collections

### Update Environment Variables

Make sure your `.env.local` has:

```bash
NEXT_PUBLIC_APPWRITE_PROJECT_MEMBERS_ID=<your-project-members-collection-id>
NEXT_PUBLIC_APPWRITE_PROJECT_ROLES_ID=<your-project-roles-collection-id>
```

### Run Migration

```bash
node scripts/migrate-to-project-rbac.js
```

---

## Quick Checklist

- [ ] Created `project_roles` collection
- [ ] Added 9 attributes to `project_roles`
- [ ] Added 2 indexes to `project_roles`
- [ ] Created `project_members` collection  
- [ ] Added 8 attributes to `project_members`
- [ ] Added 4 indexes to `project_members`
- [ ] (Optional) Added `projectId` to `teams` collection
- [ ] Updated `.env.local` with collection IDs
- [ ] Run migration script

---

## Tips

### Creating Attributes Faster
- Create attributes in the order listed above
- Use the "Bulk" option if available
- Wait for each attribute to finish creating before adding the next

### Index Names
- Appwrite will auto-generate index names
- The index keys listed are for reference only
- Make sure the attributes match exactly

### Common Issues

**"Attribute already exists"**
- Check if you already created this attribute
- Remove and recreate if needed

**"Index creation failed"**
- Make sure all attributes in the index exist first
- For unique indexes, check for duplicate data

**Migration still fails**
- Verify collection IDs in `.env.local` are correct
- Check all required attributes are created
- Ensure attribute types match exactly

---

## Verification

After creating collections, verify in Appwrite Console:

1. **project_roles** should have 9 attributes and 2 indexes
2. **project_members** should have 8 attributes and 4 indexes
3. Both collection IDs should be in `.env.local`

Then run:
```bash
node scripts/migrate-to-project-rbac.js
```
