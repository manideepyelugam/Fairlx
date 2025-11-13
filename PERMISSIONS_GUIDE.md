# Role-Based Permissions System

This document explains how to use the comprehensive role-based permissions system for teams.

## Overview

The system provides three levels of permission management:

1. **Built-in Roles**: Team Lead and Team Member with predefined permissions
2. **Custom Roles**: Create roles with specific permission sets
3. **Granular Permissions**: 18 distinct permissions across 5 categories

## Permission Categories

### Task Management
- `VIEW_TASKS` - View all team tasks
- `CREATE_TASKS` - Create new tasks
- `EDIT_TASKS` - Edit existing tasks
- `DELETE_TASKS` - Delete tasks
- `ASSIGN_TASKS` - Assign tasks to members

### Sprint Management
- `VIEW_SPRINTS` - View all sprints
- `CREATE_SPRINTS` - Create new sprints
- `EDIT_SPRINTS` - Edit sprint details
- `DELETE_SPRINTS` - Delete sprints

### Member Management
- `VIEW_MEMBERS` - View team members
- `ADD_MEMBERS` - Add new members to team
- `REMOVE_MEMBERS` - Remove members from team
- `CHANGE_MEMBER_ROLES` - Change member roles

### Team Settings
- `EDIT_TEAM_SETTINGS` - Edit team settings
- `DELETE_TEAM` - Delete the team
- `MANAGE_ROLES` - Create and edit custom roles

### Reports & Analytics
- `VIEW_REPORTS` - View team reports and analytics
- `EXPORT_DATA` - Export team data

## Using the Permissions Hook

```typescript
import { useTeamPermissions } from "@/features/teams/hooks/use-team-permissions";

// In your component
const { hasPermission, canEditTasks, canDeleteTeam, isTeamLead } = useTeamPermissions(
  currentMember,
  customRoles
);

// Check specific permission
if (hasPermission(TeamPermission.CREATE_TASKS)) {
  // Show create task button
}

// Use convenience properties
{canEditTasks && <EditTaskButton />}
{canDeleteTeam && <DeleteTeamButton />}
{isTeamLead && <LeadOnlyFeature />}
```

## Creating Custom Roles

### In UI:
1. Go to Team Settings (click Settings button in team page header)
2. Navigate to "Roles" tab
3. Click "New Role"
4. Configure:
   - **Name**: e.g., "Developer", "Designer", "QA Tester"
   - **Description**: Brief explanation of the role
   - **Badge Color**: Visual identifier
   - **Permissions**: Select from 5 categories
   - **Default Role**: Auto-assign to new members

### Programmatically:
```typescript
const { mutate: createCustomRole } = useCreateCustomRole();

createCustomRole({
  param: { teamId },
  json: {
    teamId,
    name: "Developer",
    description: "Can manage tasks and view sprints",
    color: "blue",
    permissions: [
      TeamPermission.VIEW_TASKS,
      TeamPermission.CREATE_TASKS,
      TeamPermission.EDIT_TASKS,
      TeamPermission.ASSIGN_TASKS,
      TeamPermission.VIEW_SPRINTS,
    ],
    isDefault: false,
  },
});
```

## Assigning Roles to Members

### In UI:
1. Go to team detail page
2. Hover over a member card
3. Click the three-dot menu (⋮)
4. Select from:
   - **Team Lead** (all permissions)
   - **Team Member** (basic permissions)
   - Any custom role you've created

### Programmatically:
```typescript
const { mutate: updateTeamMember } = useUpdateTeamMember();

// Assign built-in role
updateTeamMember({
  param: { teamId, memberId },
  json: { role: TeamMemberRole.LEAD },
});

// Assign custom role
updateTeamMember({
  param: { teamId, memberId },
  json: { 
    role: TeamMemberRole.CUSTOM, 
    customRoleId: customRole.$id 
  },
});
```

## Permission Checking Utilities

### Check Single Permission
```typescript
import { checkPermission } from "@/features/teams/hooks/use-team-permissions";

const canEdit = checkPermission(
  member, 
  TeamPermission.EDIT_TASKS, 
  customRoles
);
```

### Get Role Display Info
```typescript
import { getRoleDisplay } from "@/features/teams/hooks/use-team-permissions";

const roleDisplay = getRoleDisplay(
  member.role, 
  member.customRoleId, 
  customRoles
);

// Returns: { name, color, description, isCustom }
```

### Get Permissions for Role
```typescript
import { getPermissionsForRole } from "@/features/teams/hooks/use-team-permissions";

const permissions = getPermissionsForRole(
  TeamMemberRole.CUSTOM,
  customRoleId,
  customRoles
);
```

## Default Role Permissions

### Team Lead
- All 18 permissions ✓

### Team Member
- VIEW_TASKS ✓
- CREATE_TASKS ✓
- EDIT_TASKS ✓
- VIEW_SPRINTS ✓
- VIEW_MEMBERS ✓
- VIEW_REPORTS ✓

## Backend Authorization

The backend enforces permissions at the API level:

```typescript
// Only team leads and workspace admins can create roles
POST /api/teams/:teamId/custom-roles

// Only team leads and workspace admins can modify roles
PATCH /api/teams/:teamId/custom-roles/:roleId

// Prevents deletion of roles that are in use
DELETE /api/teams/:teamId/custom-roles/:roleId
```

## UI Features

### Team Settings Modal
- **General Tab**: Edit team info, visibility, delete team
- **Roles Tab**: Manage custom roles with full CRUD
- **Permissions Tab**: Overview of permission distribution

### Member Dropdown
- Shows current role with badge
- Built-in roles section
- Custom roles section (if any exist)
- "Current" indicator for active role

### Role Management Card
- Visual color badges for custom roles
- Permission count display
- "Default" badge for auto-assigned roles
- Edit/Delete actions on hover

## Best Practices

1. **Start with Built-in Roles**: Use Team Lead and Member for simple setups
2. **Create Role Templates**: Define roles like "Developer", "Manager", "Viewer"
3. **Use Default Roles**: Set one custom role as default for new members
4. **Review Regularly**: Audit permissions quarterly
5. **Principle of Least Privilege**: Only grant necessary permissions
6. **Document Roles**: Use descriptions to clarify role purposes
7. **Test Permissions**: Verify users can only access intended features

## Example: Creating a "Developer" Role

```typescript
// 1. Create the role
const developerRole = {
  teamId,
  name: "Developer",
  description: "Full task management, can view sprints, cannot delete team",
  color: "blue",
  permissions: [
    TeamPermission.VIEW_TASKS,
    TeamPermission.CREATE_TASKS,
    TeamPermission.EDIT_TASKS,
    TeamPermission.DELETE_TASKS,
    TeamPermission.ASSIGN_TASKS,
    TeamPermission.VIEW_SPRINTS,
    TeamPermission.VIEW_MEMBERS,
    TeamPermission.VIEW_REPORTS,
  ],
  isDefault: true, // Assign to new members automatically
};

// 2. Assign to a member
updateTeamMember({
  param: { teamId, memberId: "user123" },
  json: { 
    role: TeamMemberRole.CUSTOM, 
    customRoleId: developerRole.$id 
  },
});

// 3. Check permissions in UI
const { canCreateTasks, canDeleteTeam } = useTeamPermissions(member, [developerRole]);
console.log(canCreateTasks); // true
console.log(canDeleteTeam);  // false
```

## Migration Notes

### For Existing Teams
- Existing members keep their current roles (LEAD or MEMBER)
- Custom roles are optional - teams can continue using built-in roles
- No data migration required

### Adding to Database
When ready to persist custom roles, add to Appwrite:

1. Create `custom_roles` collection
2. Add attributes: `teamId`, `name`, `description`, `color`, `permissions` (string array), `isDefault` (boolean)
3. Update `CUSTOM_ROLES_ID` in `/src/config.ts`
4. Uncomment backend code in `/src/features/teams/server/route.ts`

## API Endpoints

- `GET /api/teams/:teamId/custom-roles` - List custom roles
- `POST /api/teams/:teamId/custom-roles` - Create role
- `PATCH /api/teams/:teamId/custom-roles/:roleId` - Update role
- `DELETE /api/teams/:teamId/custom-roles/:roleId` - Delete role (blocked if in use)

## TypeScript Types

All types are exported from `/src/features/teams/types.ts`:

```typescript
import {
  TeamPermission,
  TeamMemberRole,
  CustomRole,
  PERMISSION_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS,
} from "@/features/teams/types";
```
