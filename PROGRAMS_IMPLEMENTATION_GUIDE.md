# Programs Feature Implementation Guide

> **Complete End-to-End Implementation for Workspace-Level Programs with Project Linking**

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Appwrite Database Schema Changes](#4-appwrite-database-schema-changes)
5. [Feature Implementation Details](#5-feature-implementation-details)
6. [API Routes & Endpoints](#6-api-routes--endpoints)
7. [UI Components](#7-ui-components)
8. [Navigation & Routing Changes](#8-navigation--routing-changes)
9. [Permission System](#9-permission-system)
10. [Migration Strategy](#10-migration-strategy)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. Executive Summary

### What is a Program?

A **Program** is a strategic initiative that groups multiple related projects together. Programs help organizations:
- Track strategic goals across multiple projects
- Monitor aggregate progress and analytics
- Assign program-level leadership
- Coordinate cross-project dependencies

### Current Problem

Programs currently exist at the **workspace level** but have no relationship to projects. This makes them disconnected from actual work.

### Solution

Keep programs at the **workspace level** (standard approach) and add the ability to link projects to programs:
- Programs remain in workspace sidebar navigation
- Projects can be linked to programs via `programId` field
- Program detail pages show linked projects and aggregate analytics
- Cross-project analytics and reporting
- Program-level coordination and oversight

### Key Changes

| Aspect | Current State | Target State |
|--------|--------------|--------------|
| Scope | Workspace-level | Workspace-level (unchanged) |
| Location | `/workspaces/[id]/programs` | Same (with detail pages) |
| Project Link | None | Projects have `programId` field |
| Members | Only program lead | Program members with roles |
| Analytics | Types exist, not implemented | Full implementation |
| Detail Page | None | Full detail page with tabs |

---

## 2. Current State Analysis

### 2.1 Existing Programs Collection

**Collection ID**: `NEXT_PUBLIC_APPWRITE_PROGRAMS_ID`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | String (160) | ✅ | Program name |
| `description` | String (2000) | ❌ | Optional description |
| `workspaceId` | String (64) | ✅ | Parent workspace |
| `programLeadId` | String (64) | ❌ | Member ID of lead |
| `imageUrl` | String (500) | ❌ | Avatar/logo |
| `startDate` | DateTime | ❌ | Program start date |
| `endDate` | DateTime | ❌ | Program end date |
| `status` | Enum | ✅ | PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED |
| `createdBy` | String (64) | ✅ | Creator's user ID |
| `lastModifiedBy` | String (64) | ❌ | Last modifier's user ID |

### 2.2 Existing Types (`src/features/programs/types.ts`)

```typescript
export enum ProgramStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export type Program = Models.Document & {
  name: string;
  description?: string;
  workspaceId: string;
  programLeadId?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  status: ProgramStatus;
  createdBy: string;
  lastModifiedBy?: string;
};
```

### 2.3 Existing API Routes

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/api/programs` | ✅ | List programs with filters |
| GET | `/api/programs/:programId` | ✅ | Get single program |
| POST | `/api/programs` | ✅ | Create new program |
| PATCH | `/api/programs/:programId` | ✅ | Update program |
| DELETE | `/api/programs/:programId` | ✅ | Delete program |

### 2.4 What's Missing

- ❌ Project-to-Program linking
- ❌ Program detail/dashboard page
- ❌ Program members management (beyond lead)
- ❌ Program analytics endpoints
- ❌ Program-level permissions
- ❌ Program navigation in project sidebar
- ❌ Cross-project coordination features

---

## 3. Target Architecture

### 3.1 Relationship Model

```
Workspace
├── Programs (workspace-level strategic initiatives)
│   └── Program
│       ├── Program Lead (user)
│       ├── Program Members (users with roles)
│       └── Linked Projects (one-to-many)
│
└── Projects (can be linked to a program)
    ├── programId → Program (optional link)
    ├── Project Teams
    ├── Project Members
    └── Tasks
```

### 3.2 Key Relationships

| Entity | Relationship | To |
|--------|-------------|-----|
| Program | belongs_to | Workspace |
| Program | has_many | Projects (via project.programId) |
| Program | has_many | Program Members |
| Program | has_one | Program Lead |
| Project | belongs_to (optional) | Program |

### 3.3 Feature Comparison (Reference Patterns)

| Feature | Collection | Scope | Permission Model |
|---------|-----------|-------|-----------------|
| **Project Teams** | `project_teams`, `project_team_members` | Project | Team-based permissions |
| **GitHub Integration** | `github_repos`, `code_docs` | Project | Project membership |
| **Programs** | `programs`, `program_members` | Workspace | Program-based permissions |

---

## 4. Appwrite Database Schema Changes

### 4.1 Modify `projects` Collection

Add the following attribute to link projects to programs:

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `programId` | String | 64 | ❌ No | null | ID of linked program |

**Appwrite Console Steps:**
1. Go to **Databases** → Your Database → `projects` collection
2. Click **Create Attribute**
3. Type: `String`
4. Key: `programId`
5. Size: `64`
6. Required: No
7. Default: (leave empty)

**Add Index:**
| Index Key | Type | Attributes |
|-----------|------|------------|
| `programId_idx` | Key | `programId` |

### 4.2 Create `program_members` Collection (NEW)

**Collection Name**: `program_members`

**Attributes:**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `programId` | String | 64 | ✅ Yes | - | Program ID |
| `workspaceId` | String | 64 | ✅ Yes | - | Workspace ID |
| `userId` | String | 64 | ✅ Yes | - | User ID |
| `role` | Enum | - | ✅ Yes | MEMBER | LEAD, ADMIN, MEMBER, VIEWER |
| `addedBy` | String | 64 | ✅ Yes | - | User who added this member |
| `addedAt` | DateTime | - | ✅ Yes | - | When member was added |

**Indexes:**

| Index Key | Type | Attributes | Unique |
|-----------|------|------------|--------|
| `programId_idx` | Key | `programId` | No |
| `userId_idx` | Key | `userId` | No |
| `programId_userId_idx` | Unique | `programId`, `userId` | ✅ Yes |
| `workspaceId_userId_idx` | Key | `workspaceId`, `userId` | No |

**Environment Variable:**
```bash
NEXT_PUBLIC_APPWRITE_PROGRAM_MEMBERS_ID=<your-collection-id>
```

### 4.3 Create `program_milestones` Collection (NEW - Optional)

For tracking program-level milestones and goals:

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `programId` | String | 64 | ✅ Yes | - | Program ID |
| `name` | String | 200 | ✅ Yes | - | Milestone name |
| `description` | String | 2000 | ❌ No | - | Description |
| `targetDate` | DateTime | - | ❌ No | - | Target completion date |
| `status` | Enum | - | ✅ Yes | NOT_STARTED | NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED |
| `progress` | Integer | - | ❌ No | 0 | 0-100 percentage |
| `createdBy` | String | 64 | ✅ Yes | - | Creator user ID |
| `position` | Integer | - | ❌ No | 0 | Display order |

**Indexes:**

| Index Key | Type | Attributes |
|-----------|------|------------|
| `programId_idx` | Key | `programId` |
| `status_idx` | Key | `status` |

**Environment Variable:**
```bash
NEXT_PUBLIC_APPWRITE_PROGRAM_MILESTONES_ID=<your-collection-id>
```

### 4.4 Update `programs` Collection (Existing)

Add these new attributes:

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `color` | String | 20 | ❌ No | null | Theme color (hex) |
| `icon` | String | 50 | ❌ No | null | Icon name |
| `budget` | Float | - | ❌ No | null | Program budget |
| `tags` | String[] | 50 each | ❌ No | [] | Tags for categorization |
| `priority` | Enum | - | ❌ No | MEDIUM | LOW, MEDIUM, HIGH, CRITICAL |

### 4.5 Complete Schema Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      APPWRITE COLLECTIONS                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  programs (EXISTING - ENHANCED)                              │
│  ├── $id                                                     │
│  ├── name                                                    │
│  ├── description                                             │
│  ├── workspaceId ──────────────────┐                        │
│  ├── programLeadId                  │                        │
│  ├── imageUrl                       │                        │
│  ├── startDate                      │                        │
│  ├── endDate                        │                        │
│  ├── status                         │                        │
│  ├── color (NEW)                    │                        │
│  ├── icon (NEW)                     │                        │
│  ├── budget (NEW)                   │                        │
│  ├── tags[] (NEW)                   │                        │
│  ├── priority (NEW)                 │                        │
│  ├── createdBy                      │                        │
│  └── lastModifiedBy                 │                        │
│                                      │                        │
│  program_members (NEW)               │                        │
│  ├── $id                            │                        │
│  ├── programId ─────────────────────┼─── programs.$id       │
│  ├── workspaceId ───────────────────┘                        │
│  ├── userId                                                  │
│  ├── role (LEAD/ADMIN/MEMBER/VIEWER)                        │
│  ├── addedBy                                                 │
│  └── addedAt                                                 │
│                                                              │
│  projects (EXISTING - MODIFIED)                              │
│  ├── ... existing fields ...                                 │
│  └── programId (NEW) ───────────────── programs.$id         │
│                                                              │
│  program_milestones (NEW - OPTIONAL)                         │
│  ├── $id                                                     │
│  ├── programId ─────────────────────── programs.$id         │
│  ├── name                                                    │
│  ├── description                                             │
│  ├── targetDate                                              │
│  ├── status                                                  │
│  ├── progress                                                │
│  ├── createdBy                                               │
│  └── position                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Feature Implementation Details

### 5.1 New Types (`src/features/programs/types.ts`)

Add these new types:

```typescript
// Program Member Role
export enum ProgramMemberRole {
  LEAD = "LEAD",        // Full control, can manage program
  ADMIN = "ADMIN",      // Can manage projects and members
  MEMBER = "MEMBER",    // Can view and update assigned items
  VIEWER = "VIEWER",    // Read-only access
}

// Program Priority
export enum ProgramPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Milestone Status
export enum MilestoneStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DELAYED = "DELAYED",
}

// Program Member
export type ProgramMember = Models.Document & {
  programId: string;
  workspaceId: string;
  userId: string;
  role: ProgramMemberRole;
  addedBy: string;
  addedAt: string;
};

// Populated Program Member (with user details)
export type PopulatedProgramMember = ProgramMember & {
  user: {
    $id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
};

// Program Milestone
export type ProgramMilestone = Models.Document & {
  programId: string;
  name: string;
  description?: string;
  targetDate?: string;
  status: MilestoneStatus;
  progress: number;
  createdBy: string;
  position: number;
};

// Enhanced Program type
export type EnhancedProgram = Program & {
  color?: string;
  icon?: string;
  budget?: number;
  tags?: string[];
  priority?: ProgramPriority;
};

// Program with full details
export type ProgramWithDetails = EnhancedProgram & {
  programLead?: {
    $id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
  members: PopulatedProgramMember[];
  projects: Array<{
    $id: string;
    name: string;
    key: string;
    status: string;
    taskCount: number;
    completedTaskCount: number;
  }>;
  milestones: ProgramMilestone[];
  analytics: ProgramAnalytics;
};

// Program Analytics (enhanced)
export type ProgramAnalytics = {
  programId: string;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  totalMembers: number;
  totalMilestones: number;
  completedMilestones: number;
  overallProgress: number; // 0-100
  burndownData: Array<{ date: string; remaining: number; ideal: number }>;
  velocityTrend: Array<{ week: string; points: number }>;
};

// Project with Program (for project details)
export type ProjectWithProgram = {
  project: Project;
  program?: EnhancedProgram;
};
```

### 5.2 New Schemas (`src/features/programs/schemas.ts`)

```typescript
import { z } from "zod";
import { ProgramStatus, ProgramMemberRole, ProgramPriority, MilestoneStatus } from "./types";

export const programSchemas = {
  // ... existing schemas ...

  // Add programId to project
  linkProjectToProgram: z.object({
    projectId: z.string().min(1),
    programId: z.string().min(1).nullable(),
  }),

  // Program member schemas
  addProgramMember: z.object({
    programId: z.string().min(1),
    userId: z.string().min(1),
    role: z.nativeEnum(ProgramMemberRole).default(ProgramMemberRole.MEMBER),
  }),

  updateProgramMember: z.object({
    role: z.nativeEnum(ProgramMemberRole),
  }),

  // Milestone schemas
  createMilestone: z.object({
    programId: z.string().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    targetDate: z.string().datetime().optional(),
    status: z.nativeEnum(MilestoneStatus).default(MilestoneStatus.NOT_STARTED),
  }),

  updateMilestone: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    targetDate: z.string().datetime().optional().nullable(),
    status: z.nativeEnum(MilestoneStatus).optional(),
    progress: z.number().min(0).max(100).optional(),
    position: z.number().optional(),
  }),

  // Enhanced program creation
  createProgramEnhanced: z.object({
    name: z.string().min(1).max(160),
    description: z.string().max(2000).optional(),
    workspaceId: z.string().min(1),
    programLeadId: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.nativeEnum(ProgramStatus).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().max(50).optional(),
    budget: z.number().positive().optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    priority: z.nativeEnum(ProgramPriority).optional(),
  }),

  // Analytics query
  getProgramAnalytics: z.object({
    programId: z.string().min(1),
    dateRange: z.enum(["7d", "30d", "90d", "all"]).optional(),
  }),
};
```

---

## 6. API Routes & Endpoints

### 6.1 Enhanced Program Routes

Update `src/features/programs/server/route.ts`:

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/programs` | List programs | Workspace member |
| GET | `/api/programs/:programId` | Get program with details | Program member |
| POST | `/api/programs` | Create program | Workspace admin |
| PATCH | `/api/programs/:programId` | Update program | Program admin |
| DELETE | `/api/programs/:programId` | Delete program | Workspace admin |

### 6.2 New Program Members Routes

Create `src/features/programs/server/members-route.ts`:

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/programs/:programId/members` | List program members | Program member |
| POST | `/api/programs/:programId/members` | Add member to program | Program admin |
| PATCH | `/api/programs/:programId/members/:memberId` | Update member role | Program admin |
| DELETE | `/api/programs/:programId/members/:memberId` | Remove member | Program admin |

### 6.3 New Program Projects Routes

Create `src/features/programs/server/projects-route.ts`:

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/programs/:programId/projects` | List projects in program | Program member |
| POST | `/api/programs/:programId/projects` | Link project to program | Program admin + Project admin |
| DELETE | `/api/programs/:programId/projects/:projectId` | Unlink project from program | Program admin |

### 6.4 New Program Milestones Routes

Create `src/features/programs/server/milestones-route.ts`:

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/programs/:programId/milestones` | List milestones | Program member |
| POST | `/api/programs/:programId/milestones` | Create milestone | Program admin |
| PATCH | `/api/programs/:programId/milestones/:milestoneId` | Update milestone | Program admin |
| DELETE | `/api/programs/:programId/milestones/:milestoneId` | Delete milestone | Program admin |
| PATCH | `/api/programs/:programId/milestones/reorder` | Reorder milestones | Program admin |

### 6.5 New Program Analytics Routes

Create `src/features/programs/server/analytics-route.ts`:

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/programs/:programId/analytics` | Get program analytics | Program member |
| GET | `/api/programs/:programId/analytics/burndown` | Get burndown chart data | Program member |
| GET | `/api/programs/:programId/analytics/velocity` | Get velocity trend | Program member |

### 6.6 Project Route Updates

Update `src/features/projects/server/route.ts` to handle program linking:

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| PATCH | `/api/projects/:projectId` | Update project (including `programId`) | Project admin |
| GET | `/api/projects/:projectId` | Get project (include program details if linked) | Project member |

The existing project update endpoint should accept `programId` as an optional field. When fetching a project, include the linked program's basic info (name, color, status) if `programId` is set.

---

## 7. UI Components

### 7.1 New Components Structure

```
src/features/programs/components/
├── program-card.tsx              # Program card for list view (enhance existing)
├── program-detail-header.tsx     # Program detail page header
├── program-overview.tsx          # Overview dashboard tab
├── program-projects-list.tsx     # Projects linked to program
├── program-members-list.tsx      # Members management
├── program-milestones.tsx        # Milestones timeline
├── program-analytics.tsx         # Analytics dashboard
├── program-settings.tsx          # Program settings
├── add-project-to-program.tsx    # Modal to link projects to program
├── add-program-member.tsx        # Modal to add members
├── milestone-card.tsx            # Individual milestone
├── milestone-progress-bar.tsx    # Progress visualization
├── program-selector.tsx          # Dropdown to select program (for project settings)
└── program-badge.tsx             # Badge showing program link (for project cards)
```

### 7.2 Component: Program Selector (for Project Settings)

Used in project settings to link a project to a program:

```tsx
// src/features/programs/components/program-selector.tsx
interface ProgramSelectorProps {
  workspaceId: string;
  currentProgramId?: string | null;
  onProgramChange: (programId: string | null) => void;
  disabled?: boolean;
}

// Usage in project settings:
<ProgramSelector
  workspaceId={project.workspaceId}
  currentProgramId={project.programId}
  onProgramChange={(programId) => updateProject({ programId })}
/>
```

### 7.3 Component: Program Badge

Shows on project cards/headers when linked to a program:

```tsx
// src/features/programs/components/program-badge.tsx
interface ProgramBadgeProps {
  program: {
    $id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  workspaceId: string;
  size?: "sm" | "md" | "lg";
  showLink?: boolean; // If true, clicking navigates to program
}

// Usage on project card or project header:
{project.programId && (
  <ProgramBadge
    program={project.program}
    workspaceId={project.workspaceId}
    size="sm"
    showLink
  />
)}
```

### 7.4 Program Detail Page Tabs

The program detail page (`/workspaces/[workspaceId]/programs/[programId]`) should have these tabs:

1. **Overview** - Dashboard with key metrics, progress, and recent activity
2. **Projects** - List of linked projects with status and progress
3. **Milestones** - Timeline/Gantt view of milestones
4. **Members** - Program team management
5. **Analytics** - Detailed analytics and reports
6. **Settings** - Program configuration

### 7.5 Program List Enhancement

Enhance the existing programs list page to show:
- Project count per program
- Overall progress
- Quick actions (view, edit, delete)
- Filter by status, priority
- Search functionality

---

## 8. Navigation & Routing Changes

### 8.1 Keep in Workspace Sidebar

Programs remain in workspace navigation (`src/components/navigation.tsx`) - **NO CHANGES NEEDED**:

```typescript
// KEEP this navigation item as-is:
{
  label: "Programs",
  href: "/programs",
  icon: FolderKanban,
  activeIcon: FolderKanban,
  routeKey: AppRouteKey.WORKSPACE_PROGRAMS,
  workspaceScoped: true,
}
```

### 8.2 New Page Routes

Create program detail pages:

```
src/app/(dashboard)/workspaces/[workspaceId]/programs/
├── page.tsx                         # Existing - List all workspace programs
├── create/
│   └── page.tsx                     # Existing - Create program form
└── [programId]/                     # NEW - Program detail pages
    ├── page.tsx                     # Overview/Dashboard
    ├── client.tsx                   # Client component
    ├── layout.tsx                   # Program layout with tabs
    ├── projects/                    # Projects tab
    │   └── page.tsx
    ├── milestones/                  # Milestones tab
    │   └── page.tsx
    ├── members/                     # Members tab
    │   └── page.tsx
    ├── analytics/                   # Analytics tab
    │   └── page.tsx
    └── settings/                    # Settings tab
        └── page.tsx
```

### 8.3 Project Settings Enhancement

Add program selector to project settings page (`src/app/(standalone)/workspaces/[workspaceId]/projects/[projectId]/settings/client.tsx`):

In the "General" settings tab, add a dropdown to select/link the project to a program:

```tsx
// In project settings general tab
<div className="space-y-2">
  <Label>Program</Label>
  <ProgramSelector
    workspaceId={project.workspaceId}
    currentProgramId={project.programId}
    onProgramChange={handleProgramChange}
  />
  <p className="text-sm text-muted-foreground">
    Link this project to a program for cross-project tracking
  </p>
</div>
```

### 8.4 Route Helpers

Add to `src/lib/routes.ts`:

```typescript
export const routes = {
  // ... existing routes ...
  
  // Program routes (workspace-level)
  programs: (workspaceId: string) => 
    `/workspaces/${workspaceId}/programs`,
  programCreate: (workspaceId: string) => 
    `/workspaces/${workspaceId}/programs/create`,
  program: (workspaceId: string, programId: string) => 
    `/workspaces/${workspaceId}/programs/${programId}`,
  programProjects: (workspaceId: string, programId: string) => 
    `/workspaces/${workspaceId}/programs/${programId}/projects`,
  programMilestones: (workspaceId: string, programId: string) => 
    `/workspaces/${workspaceId}/programs/${programId}/milestones`,
  programMembers: (workspaceId: string, programId: string) => 
    `/workspaces/${workspaceId}/programs/${programId}/members`,
  programAnalytics: (workspaceId: string, programId: string) => 
    `/workspaces/${workspaceId}/programs/${programId}/analytics`,
  programSettings: (workspaceId: string, programId: string) => 
    `/workspaces/${workspaceId}/programs/${programId}/settings`,
};
```

---

## 9. Permission System

### 9.1 Program Permissions

Define program-level permissions:

```typescript
// src/features/programs/permissions.ts
export enum ProgramPermission {
  VIEW_PROGRAM = "VIEW_PROGRAM",
  EDIT_PROGRAM = "EDIT_PROGRAM",
  DELETE_PROGRAM = "DELETE_PROGRAM",
  MANAGE_MEMBERS = "MANAGE_MEMBERS",
  MANAGE_PROJECTS = "MANAGE_PROJECTS",
  MANAGE_MILESTONES = "MANAGE_MILESTONES",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
}

export const PROGRAM_ROLE_PERMISSIONS: Record<ProgramMemberRole, ProgramPermission[]> = {
  [ProgramMemberRole.LEAD]: [
    ProgramPermission.VIEW_PROGRAM,
    ProgramPermission.EDIT_PROGRAM,
    ProgramPermission.DELETE_PROGRAM,
    ProgramPermission.MANAGE_MEMBERS,
    ProgramPermission.MANAGE_PROJECTS,
    ProgramPermission.MANAGE_MILESTONES,
    ProgramPermission.VIEW_ANALYTICS,
  ],
  [ProgramMemberRole.ADMIN]: [
    ProgramPermission.VIEW_PROGRAM,
    ProgramPermission.EDIT_PROGRAM,
    ProgramPermission.MANAGE_MEMBERS,
    ProgramPermission.MANAGE_PROJECTS,
    ProgramPermission.MANAGE_MILESTONES,
    ProgramPermission.VIEW_ANALYTICS,
  ],
  [ProgramMemberRole.MEMBER]: [
    ProgramPermission.VIEW_PROGRAM,
    ProgramPermission.VIEW_ANALYTICS,
  ],
  [ProgramMemberRole.VIEWER]: [
    ProgramPermission.VIEW_PROGRAM,
  ],
};
```

### 9.2 Permission Check Hook

```typescript
// src/features/programs/hooks/use-program-permissions.ts
export function useProgramPermissions(programId: string) {
  const { data: member } = useGetProgramMember(programId);
  
  const hasPermission = useCallback((permission: ProgramPermission) => {
    if (!member) return false;
    return PROGRAM_ROLE_PERMISSIONS[member.role].includes(permission);
  }, [member]);
  
  return {
    isLead: member?.role === ProgramMemberRole.LEAD,
    isAdmin: member?.role === ProgramMemberRole.ADMIN,
    isMember: member?.role === ProgramMemberRole.MEMBER,
    isViewer: member?.role === ProgramMemberRole.VIEWER,
    hasPermission,
    canEdit: hasPermission(ProgramPermission.EDIT_PROGRAM),
    canManageMembers: hasPermission(ProgramPermission.MANAGE_MEMBERS),
    canManageProjects: hasPermission(ProgramPermission.MANAGE_PROJECTS),
  };
}
```

---

## 10. Migration Strategy

### 10.1 Phase 1: Database Setup (Day 1)

1. Create `program_members` collection in Appwrite
2. Add `programId` attribute to `projects` collection
3. Add new attributes to `programs` collection
4. Create necessary indexes
5. Update environment variables

### 10.2 Phase 2: Backend Implementation (Day 2-3)

1. Update `src/config.ts` with new collection IDs
2. Update `src/features/programs/types.ts` with new types
3. Update `src/features/programs/schemas.ts` with new schemas
4. Create new route files:
   - `members-route.ts`
   - `projects-route.ts`
   - `milestones-route.ts`
   - `analytics-route.ts`
5. Update main `route.ts` with enhanced endpoints
6. Update `src/features/projects/server/route.ts` to handle `programId`
7. Create API hooks in `src/features/programs/api/`

### 10.3 Phase 3: Frontend Implementation (Day 4-6)

1. Create new UI components
2. Create program detail pages
3. Create project programs page
4. Update navigation components
5. Add program selector to project settings
6. Add program badge to project cards

### 10.4 Phase 4: Testing & Polish (Day 7)

1. Test all CRUD operations
2. Test permissions
3. Test analytics calculations
4. UI/UX polish
5. Documentation

---

## 11. Implementation Checklist

### Database (Appwrite)

- [ ] Create `program_members` collection
- [ ] Add 6 attributes to `program_members`
- [ ] Add 4 indexes to `program_members`
- [ ] Add `programId` to `projects` collection
- [ ] Add `programId_idx` index to projects
- [ ] Add `color`, `icon`, `budget`, `tags`, `priority` to `programs`
- [ ] (Optional) Create `program_milestones` collection
- [ ] Update `.env.local` with new collection IDs
- [ ] Update `.env.example`
- [ ] Update deploy workflow secrets

### Backend

- [ ] Update `src/config.ts`
- [ ] Update `src/features/programs/types.ts`
- [ ] Update `src/features/programs/schemas.ts`
- [ ] Create `src/features/programs/permissions.ts`
- [ ] Create `src/features/programs/server/members-route.ts`
- [ ] Create `src/features/programs/server/projects-route.ts`
- [ ] Create `src/features/programs/server/milestones-route.ts`
- [ ] Create `src/features/programs/server/analytics-route.ts`
- [ ] Update `src/features/programs/server/route.ts`
- [ ] Update `src/features/projects/server/route.ts`
- [ ] Register routes in `src/app/api/[[...route]]/route.ts`

### API Hooks

- [ ] `useGetProgramMembers`
- [ ] `useAddProgramMember`
- [ ] `useUpdateProgramMember`
- [ ] `useRemoveProgramMember`
- [ ] `useGetProgramProjects`
- [ ] `useLinkProjectToProgram`
- [ ] `useUnlinkProjectFromProgram`
- [ ] `useGetProgramMilestones`
- [ ] `useCreateMilestone`
- [ ] `useUpdateMilestone`
- [ ] `useDeleteMilestone`
- [ ] `useGetProgramAnalytics`
- [ ] `useGetProjectProgram`
- [ ] `useUpdateProjectProgram`

### UI Components

- [ ] `ProgramCard` (enhance existing)
- [ ] `ProgramDetailHeader`
- [ ] `ProgramOverview`
- [ ] `ProgramProjectsList`
- [ ] `ProgramMembersList`
- [ ] `ProgramMilestones`
- [ ] `ProgramAnalytics`
- [ ] `ProgramSettings`
- [ ] `AddProjectToProgram`
- [ ] `AddProgramMember`
- [ ] `MilestoneCard`
- [ ] `MilestoneProgressBar`
- [ ] `ProgramSelector` (for project settings)
- [ ] `ProgramBadge` (for project cards/headers)

### Pages

- [ ] `/workspaces/[workspaceId]/programs/[programId]/page.tsx` (Overview)
- [ ] `/workspaces/[workspaceId]/programs/[programId]/client.tsx`
- [ ] `/workspaces/[workspaceId]/programs/[programId]/layout.tsx`
- [ ] `/workspaces/[workspaceId]/programs/[programId]/projects/page.tsx`
- [ ] `/workspaces/[workspaceId]/programs/[programId]/milestones/page.tsx`
- [ ] `/workspaces/[workspaceId]/programs/[programId]/members/page.tsx`
- [ ] `/workspaces/[workspaceId]/programs/[programId]/analytics/page.tsx`
- [ ] `/workspaces/[workspaceId]/programs/[programId]/settings/page.tsx`
- [ ] Update project settings page to include program selector

### Navigation

- [ ] Ensure programs link exists in workspace sidebar (should be there already)
- [ ] Add program selector to project settings page
- [ ] Add program badge to project cards/headers
- [ ] Add route helpers to `src/lib/routes.ts`
- [ ] Update route keys in `src/lib/route-permissions.ts` if needed

### Testing

- [ ] Program CRUD operations
- [ ] Member management
- [ ] Project linking/unlinking
- [ ] Milestone management
- [ ] Analytics calculations
- [ ] Permission checks
- [ ] UI responsiveness

---

## Appendix A: Environment Variables

Add to `.env.local`:

```bash
# Programs (existing)
NEXT_PUBLIC_APPWRITE_PROGRAMS_ID=<existing-programs-collection-id>

# Program Members (NEW)
NEXT_PUBLIC_APPWRITE_PROGRAM_MEMBERS_ID=<new-collection-id>

# Program Milestones (NEW - Optional)
NEXT_PUBLIC_APPWRITE_PROGRAM_MILESTONES_ID=<new-collection-id>
```

---

## Appendix B: API Response Examples

### Get Program with Details

```json
{
  "data": {
    "$id": "program-123",
    "name": "Q1 Product Launch",
    "description": "Launch new product features...",
    "workspaceId": "ws-456",
    "status": "ACTIVE",
    "priority": "HIGH",
    "color": "#3b82f6",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-03-31T00:00:00.000Z",
    "programLead": {
      "$id": "user-789",
      "name": "John Doe",
      "email": "john@example.com",
      "profileImageUrl": "https://..."
    },
    "members": [
      {
        "$id": "pm-1",
        "role": "LEAD",
        "user": { ... }
      }
    ],
    "projects": [
      {
        "$id": "proj-1",
        "name": "Mobile App",
        "key": "MOB",
        "status": "ACTIVE",
        "taskCount": 45,
        "completedTaskCount": 23
      }
    ],
    "analytics": {
      "totalProjects": 3,
      "activeProjects": 2,
      "totalTasks": 150,
      "completedTasks": 67,
      "overallProgress": 45
    }
  }
}
```

---

## Appendix C: Quick Reference

### Collections to Create

| Collection | Environment Variable |
|-----------|---------------------|
| `program_members` | `NEXT_PUBLIC_APPWRITE_PROGRAM_MEMBERS_ID` |
| `program_milestones` (optional) | `NEXT_PUBLIC_APPWRITE_PROGRAM_MILESTONES_ID` |

### Attributes to Add to Existing Collections

| Collection | Attribute | Type | Required |
|-----------|-----------|------|----------|
| `projects` | `programId` | String(64) | No |
| `programs` | `color` | String(20) | No |
| `programs` | `icon` | String(50) | No |
| `programs` | `budget` | Float | No |
| `programs` | `tags` | String[](50) | No |
| `programs` | `priority` | Enum | No |

### Key Files to Modify

| File | Changes |
|------|---------|
| `src/config.ts` | Add new collection IDs |
| `src/features/programs/types.ts` | Add new types |
| `src/features/programs/schemas.ts` | Add new schemas |
| `src/features/projects/types.ts` | Add `programId` to Project type |
| `src/lib/routes.ts` | Add program detail routes |
| `src/app/(standalone)/.../projects/[projectId]/settings/client.tsx` | Add program selector |
| Project cards/list components | Add program badge display |
| Project cards/headers | Add program badge display |
