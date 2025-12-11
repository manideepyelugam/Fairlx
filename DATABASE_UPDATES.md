# Database Schema Update Guide

## Missing Attributes to Add in Appwrite

Based on the new features implemented (Query Optimization, UI Mode, Enhanced Onboarding), here are the attributes you need to add to your Appwrite collections:

### 📊 Collection: `workspaces`

**New Attributes to Add:**

1. **uiMode** 
   - Type: `enum`
   - Values: `SIMPLE`, `ADVANCED`
   - Required: No
   - Default: `ADVANCED`
   - Description: Controls UI complexity mode

2. **enabledFeatures**
   - Type: `string` (JSON)
   - Required: No
   - Size: 1000 characters
   - Description: JSON object storing enabled features
   - Example value: `{"spaces":true,"programs":true,"teams":true,"customFields":true,"workflows":true,"timeTracking":true}`

### 🔧 How to Add These Attributes in Appwrite Console

#### Step 1: Add `uiMode` Attribute
1. Go to Appwrite Console → Databases → Your Database → `workspaces` collection
2. Click "Create Attribute"
3. Select "Enum"
4. Fill in:
   - **Attribute Key**: `uiMode`
   - **Size**: 20
   - **Elements**: Add two values:
     - `SIMPLE`
     - `ADVANCED`
   - **Required**: No
   - **Default**: `ADVANCED`
5. Click "Create"

#### Step 2: Add `enabledFeatures` Attribute
1. In the same `workspaces` collection
2. Click "Create Attribute"
3. Select "String"
4. Fill in:
   - **Attribute Key**: `enabledFeatures`
   - **Size**: 1000
   - **Required**: No
   - **Default**: (leave empty)
5. Click "Create"

### 📋 Recommended Database Indexes

To improve query performance for the hierarchical structure, add these indexes:

#### Collection: `spaces`
```
Index Name: workspace_idx
Attributes: [workspaceId]
Type: key
Order: ASC
```

#### Collection: `projects`
```
Index Name: workspace_space_idx
Attributes: [workspaceId, spaceId]
Type: key
Order: ASC, ASC
```

```
Index Name: space_idx
Attributes: [spaceId]
Type: key
Order: ASC
```

#### Collection: `work_items` (or `tasks`)
```
Index Name: workspace_project_idx
Attributes: [workspaceId, projectId]
Type: key
Order: ASC, ASC
```

```
Index Name: project_status_idx
Attributes: [projectId, status]
Type: key
Order: ASC, ASC
```

```
Index Name: assignee_status_idx
Attributes: [assigneeIds, status]
Type: key
Order: ASC, ASC
```

#### Collection: `members`
```
Index Name: workspace_user_idx
Attributes: [workspaceId, userId]
Type: unique
Order: ASC, ASC
```

#### Collection: `space_members`
```
Index Name: space_member_idx
Attributes: [spaceId, memberId]
Type: unique
Order: ASC, ASC
```

```
Index Name: user_space_idx
Attributes: [userId, spaceId]
Type: key
Order: ASC, ASC
```

### 🎯 Priority Order

**High Priority (Add First):**
1. ✅ `workspaces.uiMode` - Required for UI mode toggle
2. ✅ `workspaces.enabledFeatures` - Required for feature flags
3. ✅ Index on `spaces.workspaceId` - Improves spaces query performance
4. ✅ Index on `projects.spaceId` - Improves project lookups

**Medium Priority:**
5. Index on `work_items.projectId` and `work_items.status`
6. Index on `members.workspaceId` and `members.userId`

**Low Priority:**
7. Other composite indexes for specific query patterns

### 🔄 Backward Compatibility

All new attributes are optional, so existing data will continue to work:
- If `uiMode` is not set, it defaults to `ADVANCED`
- If `enabledFeatures` is not set, all features are enabled by default
- Existing queries will continue to work without indexes (just slower)

### ✅ Verification

After adding these attributes, verify by:
1. Creating a new workspace and checking if `uiMode` is saved
2. Updating workspace settings to toggle UI mode
3. Query performance improvements (use Appwrite Console → Databases → Logs)

### 📝 Notes

- **JSON Storage**: Appwrite doesn't have native JSON type, so `enabledFeatures` is stored as a string. The app handles parsing.
- **Indexes**: Adding indexes is non-destructive and can be done anytime
- **Migration**: No data migration needed since all fields are optional with sensible defaults

---

## 🚨 CRITICAL: Missing Workflow Transition Attributes

### 📊 Collection: `workflow_transitions`

**Current Attributes in Database:**
- ✅ workflowId (string, 36, required)
- ✅ fromStatusId (string, 36, required)
- ✅ toStatusId (string, 36, required)
- ✅ name (string, 128, optional)
- ✅ allowedRoles (string[], 500, optional)

**Missing Attributes (MUST ADD):**

1. **description**
   - Type: `string`
   - Size: 500
   - Required: No
   - Description: Description of the transition

2. **requiredFields**
   - Type: `string[]` (array)
   - Size: 100 per element
   - Required: No
   - Description: Fields that must be filled to perform this transition

3. **autoAssign**
   - Type: `boolean`
   - Required: No
   - Default: `false`
   - Description: Whether to auto-assign the task to current user on transition

### 🔧 How to Add These Attributes

#### Step 1: Add `description` Attribute
1. Go to Appwrite Console → Databases → Your Database → `workflow_transitions` collection
2. Click "Create Attribute"
3. Select "String"
4. Fill in:
   - **Attribute Key**: `description`
   - **Size**: 500
   - **Required**: No
5. Click "Create"

#### Step 2: Add `requiredFields` Attribute
1. In the same `workflow_transitions` collection
2. Click "Create Attribute"
3. Select "String"
4. Check "Array"
5. Fill in:
   - **Attribute Key**: `requiredFields`
   - **Size**: 100
   - **Required**: No
6. Click "Create"

#### Step 3: Add `autoAssign` Attribute
1. In the same `workflow_transitions` collection
2. Click "Create Attribute"
3. Select "Boolean"
4. Fill in:
   - **Attribute Key**: `autoAssign`
   - **Required**: No
   - **Default**: false
5. Click "Create"

### ⚠️ Current Status
- The code is currently trying to use these attributes but they don't exist in the database
- This is causing "Invalid document structure: Unknown attribute" errors
- The code has been temporarily patched to remove references to missing attributes
- **ACTION REQUIRED**: Add these attributes to the database immediately
