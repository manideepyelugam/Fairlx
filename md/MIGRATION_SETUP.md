# Quick Setup Guide: Adding projectId to Teams Collection

## Issue
The `teams` collection in Appwrite doesn't have a `projectId` attribute yet, which is required for project-scoped RBAC.

## Solution Options

### Option 1: Add projectId Attribute (Recommended)

1. **Go to Appwrite Console**
2. **Navigate to**: Database → Your Database → `teams` collection
3. **Add New Attribute**:
   - **Key**: `projectId`
   - **Type**: String
   - **Size**: 50
   - **Required**: No (optional for backward compatibility)
   - **Array**: No
   
4. **Run the migration script**:
   ```bash
   node scripts/migrate-to-project-rbac.js
   ```

### Option 2: Run Migration Without projectId

The updated migration script will now work even without the `projectId` attribute in teams. It will:

1. Create teams **without** `projectId` (fallback)
2. Still create all roles and project members correctly
3. Warn you that teams need to be updated manually later

**To run:**
```bash
node scripts/migrate-to-project-rbac.js
```

**Note**: Teams created without `projectId` will still work, but you won't be able to filter teams by project until you:
1. Add the `projectId` attribute to the teams collection
2. Manually update existing teams with their `projectId` values

## Recommended Approach

**Use Option 1** - Add the attribute first, then run migration. This ensures:
- ✅ Teams are properly associated with projects from the start
- ✅ No manual updates needed later
- ✅ Cleaner data structure

## After Migration

Once migration completes successfully, the system will have:
- Default roles (Project Admin, Project Member, Viewer) for each project
- Default "General" team for each project  
- All workspace members migrated to project members with appropriate roles
