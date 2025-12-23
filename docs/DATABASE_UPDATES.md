# Database Updates

## Workflow Schema Redesign (StatusType Migration)

**Date**: 2024
**Purpose**: Simplify workflow status schema and add team-based transition rules

### Summary of Changes

#### workflow_statuses Collection

**Removed Fields:**
- `category` (StatusCategory enum with 6 values: TODO, ASSIGNED, IN_PROGRESS, IN_REVIEW, DONE, CUSTOM)
- `customColumnId` (no longer needed - workflows are now independent of custom columns)

**Added Fields:**
- `statusType` - Simple 3-value enum for analytics:
  - `OPEN` - Work not yet started (gray)
  - `IN_PROGRESS` - Work in progress (blue)
  - `CLOSED` - Work completed (green)
- `icon` - User-selectable icon name (e.g., "circle", "check-circle", "bug", "rocket", etc.)

#### workflow_transitions Collection

**Added Fields:**
- `allowedTeamIds` - Array of team IDs that can make this transition
- `allowedMemberRoles` - Array of member roles (ADMIN, MEMBER) that can make this transition
- `requiresApproval` - Boolean indicating if transition needs approval
- `approverTeamIds` - Array of team IDs that can approve this transition
- `conditions` - JSON string for automation conditions (e.g., ALL_SUBTASKS_DONE)
- `autoTransition` - Boolean for automatic transitions when conditions are met

### Schema Verification

**Status**: ✅ **Complete** - Schema verified via MCP on December 19, 2025

All required attributes have been confirmed to exist in the Appwrite database:

**workflow_statuses collection:**
- ✅ `statusType` (enum: OPEN, IN_PROGRESS, CLOSED)
- ✅ `icon` (string, size: 50, default: 'circle')
- ℹ️ Old `category` and `customColumnId` fields still present for backwards compatibility

**workflow_transitions collection:**
- ✅ `allowedTeamIds` (array of strings, size: 36)
- ✅ `allowedMemberRoles` (array of strings, size: 20)
- ✅ `requiresApproval` (boolean, default: false)
- ✅ `approverTeamIds` (array of strings, size: 36)
- ✅ `conditions` (string, size: 5000)
- ✅ `autoTransition` (boolean, default: false)

### API Changes

#### Replaced Endpoints:
- `POST /:workflowId/sync-from-project/:projectId` → `POST /:workflowId/connect-project/:projectId`
  - New endpoint simply connects a project to a workflow (updates project.workflowId)
  - No longer syncs custom columns (workflows are now independent)

#### Enhanced Endpoints:
- `POST /:workflowId/validate-transition` - Now checks team-based permissions
- `GET /:workflowId/allowed-transitions` - Now filters by user's team membership

### Type Changes

**Old (StatusCategory):**
```typescript
enum StatusCategory {
  TODO = "TODO",
  ASSIGNED = "ASSIGNED", 
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  CUSTOM = "CUSTOM"
}
```

**New (StatusType):**
```typescript
enum StatusType {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  CLOSED = "CLOSED"
}
```

### Rationale

1. **Simplified Analytics**: 3 status types (open/in-progress/closed) are sufficient for analytics and reporting
2. **User Flexibility**: Users can now pick any icon for their statuses instead of being constrained by category
3. **Independence**: Workflows no longer depend on custom_columns collection
4. **Team Rules**: Transitions can now enforce team-based access control for approval workflows
