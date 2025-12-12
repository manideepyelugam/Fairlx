# Workflow Feature - Appwrite Database Update Guide

This document describes all the database schema changes required for the redesigned workflow feature with drag-and-drop visual editor.

## Overview

The workflow feature allows users to create custom workflows with visual status nodes and transition connections. Each workspace/space/project can have multiple workflows, and work items follow these workflows.

---

## Collection: `workflows`

### Required Attributes

| Attribute     | Type    | Size | Required | Default | Array | Notes |
|---------------|---------|------|----------|---------|-------|-------|
| `name`        | string  | 100  | Yes      | -       | No    | Workflow display name |
| `key`         | string  | 50   | Yes      | -       | No    | Unique key (uppercase, e.g., `SOFTWARE_DEV`) |
| `description` | string  | 500  | No       | null    | No    | Optional description |
| `workspaceId` | string  | 36   | Yes      | -       | No    | Reference to workspace |
| `spaceId`     | string  | 36   | No       | null    | No    | Optional space-level scope |
| `projectId`   | string  | 36   | No       | null    | No    | Optional project-level scope |
| `isDefault`   | boolean | -    | No       | false   | No    | Whether this is the default workflow |
| `isSystem`    | boolean | -    | No       | false   | No    | **NEW** - System workflows cannot be edited |
| `isArchived`  | boolean | -    | No       | false   | No    | **NEW** - Soft delete flag |

### New Attributes to Add

If your collection already exists, add these attributes:

1. **`isSystem`** (boolean)
   - Required: No
   - Default: `false`
   - Purpose: Marks workflows that are system-provided and cannot be modified

2. **`isArchived`** (boolean)
   - Required: No
   - Default: `false`
   - Purpose: Soft delete - archived workflows are hidden but preserved

### Indexes

| Index Name         | Type   | Attributes                     | Orders |
|--------------------|--------|--------------------------------|--------|
| `workspaceId`      | Key    | `workspaceId`                  | ASC    |
| `spaceId`          | Key    | `spaceId`                      | ASC    |
| `projectId`        | Key    | `projectId`                    | ASC    |
| `workspace_key`    | Unique | `workspaceId`, `key`           | ASC    |
| `isDefault`        | Key    | `workspaceId`, `isDefault`     | ASC    |

---

## Collection: `workflow_statuses`

### Required Attributes

| Attribute     | Type    | Size | Required | Default | Array | Notes |
|---------------|---------|------|----------|---------|-------|-------|
| `workflowId`  | string  | 36   | Yes      | -       | No    | Reference to workflow |
| `name`        | string  | 50   | Yes      | -       | No    | Status display name |
| `key`         | string  | 30   | Yes      | -       | No    | **NEW** - Unique key within workflow (e.g., `IN_PROGRESS`) |
| `category`    | enum    | -    | Yes      | -       | No    | One of: `TODO`, `IN_PROGRESS`, `DONE` |
| `color`       | string  | 7    | Yes      | -       | No    | Hex color (e.g., `#3B82F6`) |
| `description` | string  | 200  | No       | null    | No    | Optional description |
| `position`    | integer | -    | Yes      | 0       | No    | Order in workflow (0-based) |
| `positionX`   | integer | -    | No       | 0       | No    | **NEW** - X coordinate for visual editor |
| `positionY`   | integer | -    | No       | 0       | No    | **NEW** - Y coordinate for visual editor |
| `isInitial`   | boolean | -    | No       | false   | No    | Whether this is the starting status |
| `isFinal`     | boolean | -    | No       | false   | No    | Whether this is an end status |

### New Attributes to Add

If your collection already exists, add these attributes:

1. **`key`** (string)
   - Size: 30
   - Required: Yes (for new records)
   - Purpose: Unique identifier key for the status within its workflow
   - Format: Uppercase letters, numbers, underscores (e.g., `IN_REVIEW`)

2. **`positionX`** (integer)
   - Required: No
   - Default: `0`
   - Purpose: X-axis position in the visual drag-and-drop editor

3. **`positionY`** (integer)
   - Required: No
   - Default: `0`
   - Purpose: Y-axis position in the visual drag-and-drop editor

### Indexes

| Index Name        | Type   | Attributes                     | Orders |
|-------------------|--------|--------------------------------|--------|
| `workflowId`      | Key    | `workflowId`                   | ASC    |
| `workflow_key`    | Unique | `workflowId`, `key`            | ASC    |
| `position`        | Key    | `workflowId`, `position`       | ASC    |
| `category`        | Key    | `category`                     | ASC    |

---

## Collection: `workflow_transitions`

### Required Attributes

| Attribute        | Type    | Size | Required | Default | Array | Notes |
|------------------|---------|------|----------|---------|-------|-------|
| `workflowId`     | string  | 36   | Yes      | -       | No    | Reference to workflow |
| `fromStatusId`   | string  | 36   | Yes      | -       | No    | Source status ID |
| `toStatusId`     | string  | 36   | Yes      | -       | No    | Target status ID |
| `name`           | string  | 50   | No       | null    | No    | Optional transition name (e.g., "Start Work") |
| `description`    | string  | 200  | No       | null    | No    | Optional description |
| `requiredFields` | string  | -    | No       | null    | Yes   | Array of field names required before transition |
| `allowedRoles`   | string  | -    | No       | null    | Yes   | Array of roles allowed to make this transition |
| `autoAssign`     | boolean | -    | No       | false   | No    | Auto-assign to user making transition |

### Indexes

| Index Name        | Type   | Attributes                                    | Orders |
|-------------------|--------|-----------------------------------------------|--------|
| `workflowId`      | Key    | `workflowId`                                  | ASC    |
| `fromStatusId`    | Key    | `fromStatusId`                                | ASC    |
| `toStatusId`      | Key    | `toStatusId`                                  | ASC    |
| `unique_transition` | Unique | `workflowId`, `fromStatusId`, `toStatusId` | ASC    |

---

## Migration Steps

### Step 1: Update `workflows` Collection

```
1. Navigate to Appwrite Console > Databases > Your Database > workflows
2. Add attribute: isSystem (boolean, default: false)
3. Add attribute: isArchived (boolean, default: false)
```

### Step 2: Update `workflow_statuses` Collection

```
1. Navigate to Appwrite Console > Databases > Your Database > workflow_statuses
2. Add attribute: key (string, size: 30, required: false initially)
3. Add attribute: positionX (integer, default: 0)
4. Add attribute: positionY (integer, default: 0)
5. Run migration script to generate keys for existing records
6. Make key required after migration
7. Add unique index on (workflowId, key)
```

### Step 3: Data Migration Script

For existing status records without `key`, `positionX`, or `positionY`:

```javascript
// Pseudo-code for migration
const statuses = await databases.listDocuments(DATABASE_ID, WORKFLOW_STATUSES_ID);

for (const status of statuses.documents) {
  const updates = {};
  
  // Generate key from name if missing
  if (!status.key) {
    updates.key = status.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 30);
  }
  
  // Set default positions if missing
  if (status.positionX === undefined) {
    updates.positionX = status.position * 250; // Spread horizontally
  }
  if (status.positionY === undefined) {
    updates.positionY = 100; // Fixed vertical position
  }
  
  if (Object.keys(updates).length > 0) {
    await databases.updateDocument(
      DATABASE_ID, 
      WORKFLOW_STATUSES_ID, 
      status.$id, 
      updates
    );
  }
}
```

---

## Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_WORKFLOWS_ID=your_workflows_collection_id
NEXT_PUBLIC_APPWRITE_WORKFLOW_STATUSES_ID=your_workflow_statuses_collection_id
NEXT_PUBLIC_APPWRITE_WORKFLOW_TRANSITIONS_ID=your_workflow_transitions_collection_id
```

---

## Status Categories

The system uses simplified status categories:

| Category       | Description                  | Default Color |
|----------------|------------------------------|---------------|
| `TODO`         | Work not yet started         | `#6B7280`     |
| `IN_PROGRESS`  | Work currently being done    | `#3B82F6`     |
| `DONE`         | Work completed               | `#10B981`     |

**Note:** Previous implementations may have had 5 categories (`ASSIGNED`, `IN_REVIEW`). These have been consolidated into the 3 categories above. Update any existing data accordingly:
- `ASSIGNED` → `TODO`
- `IN_REVIEW` → `IN_PROGRESS`

---

## Permissions

Recommended permission model:

### workflows collection
- Create: Team members with admin role
- Read: All team members
- Update: Team members with admin role (except system workflows)
- Delete: Team members with admin role (except system workflows)

### workflow_statuses collection
- Create: Team members with admin role
- Read: All team members
- Update: Team members with admin role
- Delete: Team members with admin role

### workflow_transitions collection
- Create: Team members with admin role
- Read: All team members
- Update: Team members with admin role
- Delete: Team members with admin role

---

## Testing Checklist

After making database changes, verify:

- [ ] Can create new workflow with statuses
- [ ] Workflow templates create correct statuses and transitions
- [ ] Can drag status nodes and positions save correctly
- [ ] Can connect statuses to create transitions
- [ ] Can edit status name, color, category
- [ ] Can edit transition rules (requiredFields, allowedRoles, autoAssign)
- [ ] Can delete statuses (cascades to transitions)
- [ ] Can delete transitions
- [ ] System workflows cannot be edited
- [ ] Archived workflows don't appear in lists

---

## Summary of New Fields

| Collection          | New Attributes                           |
|---------------------|------------------------------------------|
| `workflows`         | `isSystem`, `isArchived`                 |
| `workflow_statuses` | `key`, `positionX`, `positionY`          |
| `workflow_transitions` | (no new attributes)                   |

## Summary of Changes by Type

### CREATE (New Attributes)
1. `workflows.isSystem` (boolean)
2. `workflows.isArchived` (boolean)
3. `workflow_statuses.key` (string)
4. `workflow_statuses.positionX` (integer)
5. `workflow_statuses.positionY` (integer)

### UPDATE (Schema Changes)
- Status `category` enum simplified from 5 to 3 values

### DELETE
- None (all changes are additive)
