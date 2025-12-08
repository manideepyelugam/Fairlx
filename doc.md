# 🧠 PMT Product & Development Logic — “Jira-like” Full Functional System

## 0. Overview

This document describes **how to design and implement** a full-featured Project Management Tool (PMT) similar to Jira, including:

- **Information architecture** (Workspace → Space → Project/Board → Work Items)
- **Work item model** (Epics, Tasks, Sub-tasks, Bugs, etc.)
- **Kanban & Sprints relationship** (including “locked Kanban if no sprint active”)
- **Custom fields & custom work item types**
- **Views**: Kanban, List, Calendar, Timeline (Gantt-like), Backlog
- **Dashboards**: Workspace dashboard, Personal dashboard
- **Auxiliary systems**: Permissions, notifications, activity logs, search, filters

This is written as a **functional + development logic spec**, not just UX copy.

---

## 1. Core Concepts & Hierarchy

### 1.1 Entities & Hierarchy

**Top-down:**

1. **Workspace**
    - Represents an organization or company.
    - Contains:
        - Users & roles
        - Spaces
        - Global settings (custom fields directory, global workflows, integrations)
        - Billing & usage (optional)
2. **Space**
    - Logical container for related work (product, department, client, etc.)
    - Contains:
        - Projects / Boards
        - Space-level configurations (default workflows, permissions, templates)
        - Shared resources: labels, components, custom field presets
3. **Project / Board**
    - A specific stream of work (e.g. “Web App”, “Marketing”, “Mobile App”).
    - Can have multiple **views**:
        - Backlog
        - Kanban Board
        - Sprint Board
        - Calendar View
        - Timeline View
        - List View
    - Owns:
        - Work items (tasks, bugs, epics, etc.)
        - Sprints
        - Local workflows (if overridden from space default)
4. **Work Item**
    - The atomic piece of work.
    - Types: Epic, Story, Task, Bug, Sub-task, etc. (customizable)
    - Can form tree:
        - Epic
            - Task/Story
                - Sub-task
5. **User**
    - Member of one or more workspaces.
    - Has roles/permissions per workspace & per space/project.

---

## 2. Work Item Model

### 2.1 Work Item Fields (Base Schema)

All work item types share a base schema:

- `id` (UUID)
- `key` (human friendly, e.g. `WEB-123`)
- `workspace_id`
- `space_id`
- `project_id`
- `type` (enum: EPIC, STORY, TASK, BUG, SUBTASK, etc.)
- `parent_id` (nullable; for sub-items)
- `title`
- `description` (rich text)
- `status_id` (links to workflow status)
- `priority` (LOW, MEDIUM, HIGH, CRITICAL)
- `assignee_id` (nullable)
- `reporter_id`
- `created_at`, `updated_at`
- `start_date` (for calendar/timeline)
- `due_date`
- `estimate` (in story points or hours)
- `remaining_estimate`
- `sprint_id` (nullable)
- `labels` (array of strings or label IDs)
- `components` (array of component IDs)
- `custom_fields` (JSON map: `field_id -> value`)

### 2.2 Work Item Types & Hierarchy Logic

- **Epic**
    - `type = EPIC`
    - `parent_id = null`
    - Can have children of type `STORY`, `TASK`, `BUG`.
- **Story / Task**
    - `type = STORY` or `TASK`
    - `parent_id` can point to an EPIC.
    - Can have children of type `SUBTASK`.
- **Sub-task**
    - `type = SUBTASK`
    - Must have `parent_id` referring to another non-subtask item.
- **Bug**
    - Similar to Story/Task; can optionally have parent (Epic).

**Development logic (validation):**

- On create/update:
    - If `type = SUBTASK`, then `parent_id` **must not be null** and must reference an item with `type != SUBTASK`.
    - If `parent_id` is set, ensure no cycles (parent is not a descendant).
- On delete:
    - If item has children, either:
        - Prevent delete, or
        - Cascade delete, or
        - Soft delete and keep a reference for audit.

---

## 3. Spaces & Workspace Flow (First Step)

### 3.1 First-Time User Journey

**Step 1: Create Workspace**

- Input:
    - Workspace name
    - Organization domain (optional)
- System:
    - Create workspace record
    - Make current user `Owner`
    - Create default roles (Owner, Admin, Member, Viewer)

**Step 2: Create First Space**

- Prompt: “Create your first Space”
- Inputs:
    - Space name (e.g. “Product”, “Engineering”, “Client A”)
    - Space type template (Software, Kanban only, Marketing, etc.)
- System:
    - Create space record
    - Apply default workflow, issue types, custom fields from chosen template

**Step 3: Create First Project/Board in Space**

- Input:
    - Project/Board name
    - Board type: `Scrum` or `Kanban` (or hybrid)
- System:
    - Create project record
    - Initialize:
        - Default statuses (To Do, In Progress, Done)
        - Default columns for Kanban
        - Default sprint settings (if Scrum)

### 3.2 Workspace vs Space Logic

- **Workspace**
    - Owns users & global permissions.
    - Controls billing, global integrations.
- **Space**
    - Controls visibility:
        - Public to workspace, or
        - Private (invite only).
    - Has its own roles:
        - Space Admin (manage settings)
        - Member (can create/edit issues)
        - Viewer (read-only)
- **Projects/Boards**
    - Inherit permissions from space, but can have additional restrictions (e.g. private project in public space).

---

## 4. Kanban Board & Sprints

### 4.1 Statuses, Columns, and Workflows

**Workflow Statuses:**

- `statuses` table:
    - `id`, `name` (To Do, In Progress, Done, etc.)
    - `category` (TODO, IN_PROGRESS, DONE)
    - `project_id` / `workflow_id`

**Kanban Columns:**

- Each column maps to one or more statuses:
    - Example columns:
        - Backlog (TODO)
        - In Progress (IN_PROGRESS)
        - Review (IN_PROGRESS)
        - Done (DONE)

**Development logic:**

- When user drags a card to another column:
    - Determine allowed destination statuses based on workflow.
    - If multiple statuses per column:
        - Use first allowed status, or show a small dropdown to pick.
    - Validate transitions:
        - Using `workflow_transitions` table: `from_status_id`, `to_status_id`.
        - If invalid, reject move with message.

### 4.2 Sprint Concepts

**Sprint Fields:**

- `id`
- `project_id`
- `name`
- `goal`
- `start_date`, `end_date`
- `status` (PLANNED, ACTIVE, COMPLETED, CANCELLED)
- `created_at`, `completed_at`

**Sprint lifecycle:**

1. **Create sprint** in Backlog view.
2. Add work items to sprint from backlog.
3. **Start sprint** → `status = ACTIVE`.
4. During sprint:
    - Kanban board shows only items in active sprint (if Scrum board).
5. **Complete sprint**:
    - Move incomplete issues to:
        - Next sprint (if exists), or
        - Backlog.

### 4.3 “Kanban is Locked if No Sprints Active”

Assume this applies to **Scrum boards** (i.e. boards that rely on sprints).

**Rules:**

- If `project.board_type = SCRUM`:
    - **No active sprint** (`SPRINT` where `status = ACTIVE` and now between `start_date` & `end_date`):
        - Kanban board should be **read-only / locked**:
            - Cannot move cards
            - Cannot create new issues directly onto the board
            - Show message: “Start a sprint to use this board.”
        - Allowed interactions:
            - View existing issues
            - Open issue details
    - **Active sprint exists**:
        - Kanban board is unlocked for:
            - Drag/drop between columns (changes status)
            - Inline create new work items assigned to the active sprint.

**Implementation logic (pseudo):**

```
function getKanbanBoardState(project_id, user_id):
    board = getBoard(project_id)
    active_sprint = findActiveSprint(project_id, now())

    if board.type == "SCRUM" and !active_sprint:
        return { locked: true, reason: "NO_ACTIVE_SPRINT" }
    else if !hasPermission(user_id, "EDIT_BOARD", project_id):
        return { locked: true, reason: "NO_PERMISSION" }
    else:
        return { locked: false }
```

- UI uses `locked` flag:
    - Disable drag-and-drop.
    - Hide “Create card” in columns.
    - Show a banner with call-to-action: “Go to Backlog to start a sprint.”

**Note:** You can allow **Kanban-only boards** (non-Scrum) that are **never locked** and do not depend on sprints.

---

## 5. Custom Fields & Custom Work Item Types

### 5.1 Custom Field Model

**Custom field definitions:**

- `custom_fields` table:
    - `id`
    - `workspace_id` or `space_id` (scope)
    - `name`
    - `key` (e.g. `risk_level`)
    - `type` (TEXT, NUMBER, DATE, SELECT, MULTI_SELECT, USER, BOOLEAN)
    - `options` (JSON for select types)
    - `is_required`
    - `default_value`
    - `applies_to_types` (array: [TASK, BUG, EPIC])

**Custom field values storage options:**

1. **Flexible JSON** in `work_items.custom_fields`
2. Or a separate table `custom_field_values(work_item_id, field_id, value_text, value_number, value_date, etc.)`.

For simplicity, we assume JSON on the work item: `custom_fields: { [field_id]: value }`.

### 5.2 Custom Work Item Types

Requirements:

- Admin can define custom item types (e.g. “Risk”, “Change Request”).
- Each type can:
    - Use specific workflow
    - Have specific default custom fields

**Type definition:**

- `issue_types` table:
    - `id`
    - `name`
    - `key` (RISK, CHANGE_REQUEST)
    - `workspace_id` / `space_id`
    - `icon`
    - `default_workflow_id`
    - `default_fields` (JSON: list of custom_field_ids)

**Creation logic:**

- When creating a new work item:
    - Type selector shows allowed types for this project/space.
    - Based on type:
        - Pre-attach appropriate custom fields.
        - Set default status (`workflow.default_start_status`).

---

## 6. Work Item Operations: Split, Sub-Items, and Cloning

### 6.1 Creating Sub Work Items (Sub-tasks)

From a work item view (e.g. TASK):

- User clicks “Add sub-task”.
- Input:
    - title, optional assignee, estimate.
- System:
    - Create new work item with `type = SUBTASK`, `parent_id = parent.id`.
    - Inherit:
        - `project_id`, `space_id`, `workspace_id`
        - Possibly `sprint_id`, `labels`, `components`.

### 6.2 Split Task / Split Work Item

**Use case:** Task is too big; split into multiple smaller tasks.

**Flow:**

1. User opens a task.
2. Trigger “Split Task”.
3. Options:
    - Convert current task into a parent (Epic/Story) and create child tasks.
    - OR keep it as “original task” and create additional sibling tasks linked via relation.

**Implementation pattern (recommended):**

- Keep the **original task** but mark part of its scope as moved.
- Show a modal:
    - “How many new tasks?”
    - Provide form for each new task: title, estimate, assignee.
    - Option: distribute remaining estimate automatically.

**Logic example:**

- Original Task `T1` has estimate = 8h.
- User creates `T2` (4h), `T3` (3h).
- System:
    - Create `T2`, `T3` as new tasks.
    - Link them to `T1` via a relation type `SPLIT_FROM`.
    - Reduce `T1` estimate to 1h, or mark `T1` as “Split/obsolete” and no longer active.

**Data model for relations:**

- `work_item_links`:
    - `id`
    - `from_work_item_id`
    - `to_work_item_id`
    - `type` (BLOCKS, DUPLICATES, SPLIT_FROM, RELATES_TO)

### 6.3 Cloning / Duplicating Work Items

- “Clone” action:
    - Copies:
        - Title, description, labels, components
        - Custom fields
    - Option to:
        - Copy sub-tasks
    - Resets:
        - Status → default
        - Sprint → null
        - Assignee → null (optional)

---

## 7. Views: Backlog, Kanban, List, Calendar, Timeline

### 7.1 Backlog View

Purpose: Prioritize upcoming work and plan sprints.

Features:

- List of unscheduled items (no sprint).
- Ability to:
    - Sort & filter (by priority, type, etc.)
    - Drag items into sprints
    - Create new sprints
    - Edit item inline (title, estimate, type)
- Bulk actions:
    - Change priority
    - Move to sprint
    - Add label

Development notes:

- Fetch query:
    - `WHERE project_id = ? AND sprint_id IS NULL AND status NOT IN (DONE)` (or as per logic).
- Pagination or infinite scroll.

### 7.2 Kanban Board View

Purpose: Visualize the current flow of work.

Data needed:

- Columns (statuses + mapping)
- Items in scope:
    - For Scrum board: items in active sprint.
    - For Kanban board: items filtered by status/date.

Features:

- Drag-and-drop between columns (if board not locked).
- WIP limits:
    - Column has `wip_limit` integer.
    - On drop:
        - If column count > limit → show warning (soft or hard block).
- Swimlanes:
    - By assignee, epic, or type.

“Board locked” state applied as described in 4.3.

### 7.3 List View

Tabular view of work items:

- Columns: Key, Title, Status, Assignee, Sprint, Priority, etc.
- Supports:
    - Sorting
    - Filtering
    - Bulk actions (change status, assignee, etc.)

### 7.4 Calendar View

Purpose: See items by dates.

**Data model:**

- Use `start_date` and `due_date` from work item.

**View logic:**

- Month/Week/Day toggles.
- Each work item appears:
    - As a bar spanning from `start_date` to `due_date` if both present.
    - Or as an all-day item on `due_date` if only due_date exists.

**Interactions:**

- Drag item across days:
    - Updates `start_date` / `due_date`.
- Resize:
    - Changes `due_date` (or start date).
- Filter:
    - By project, assignee, type, status.

### 7.5 Timeline (Gantt) View

Similar to calendar but with a **Gantt chart** layout.

**Key logic:**

- Y-axis: list of tasks (grouped by project/epic).
- X-axis: time (days/weeks).
- Each item: bar from `start_date` to `due_date`.
- Dependencies:
    - `work_item_links` with type `DEPENDS_ON`.
    - Show arrows between bars.
- Editing:
    - Drag bar → adjust dates.
    - Drag endpoint of bar → extend/shrink.
    - Drag arrow to add dependency.

**Data queries:**

- Filter by project/space.
- Show only items with dates or allow inline date creation from timeline.

---

## 8. Dashboards

### 8.1 Workspace Dashboard

Purpose: Bird’s-eye view of everything in the workspace.

Widgets (examples):

1. **Active Sprints Overview**
    - List active sprints across spaces:
        - Project name
        - Sprint goal
        - Progress (completed vs total points)
2. **Workload by Assignee**
    - Bar chart: total points/tasks by assignee.
3. **Issue Type Breakdown**
    - Pie chart: tasks vs bugs vs stories, etc.
4. **Cycle Time / Lead Time**
    - Average time from `TODO → DONE` per space.
5. **Recent Activity Feed**
    - Recent changes (status updates, new items, comments).

Development logic:

- Dashboard layout stored per user (cards order, filters).
- Each widget fetches data via dedicated API endpoints e.g.:
    - `GET /workspace/{id}/metrics/active-sprints`
    - `GET /workspace/{id}/metrics/workload`

### 8.2 Personal Dashboard

Purpose: Focused view for the individual user.

Sections:

1. **My Work**
    - Items where `assignee_id = current_user` and `status != DONE`.
    - Grouped by:
        - Due date (overdue, due this week, later).
2. **My Sprints**
    - Sprints where user is a member (has items assigned).
3. **My Calendar**
    - Calendar view of items assigned to user.
4. **Notifications / Mentions**
    - Items where user was mentioned recently.
5. **Recently Viewed**
    - Items and boards user opened.

Implementation:

- Persistent filters: e.g. default filter is “Assignee = me”.
- Ability to pin specific views or saved filters as widgets.

---

## 9. Workspace & Project Configuration

### 9.1 Roles & Permissions

**Role examples:**

- Workspace Owner
- Workspace Admin
- Space Admin
- Project Admin
- Member
- Viewer

**Permission modules:**

- Work items:
    - CREATE_WORK_ITEM
    - EDIT_WORK_ITEM
    - DELETE_WORK_ITEM
    - CHANGE_STATUS
- Sprints:
    - CREATE_SPRINT
    - START_SPRINT
    - COMPLETE_SPRINT
- Board:
    - CONFIGURE_COLUMNS
    - MANAGE_WORKFLOWS
- Admin:
    - MANAGE_USERS
    - MANAGE_CUSTOM_FIELDS

Implementation:

- `roles` and `permissions` tables.
- `role_permissions` mapping.
- `user_roles` per workspace/space/project.
- Permission check util on backend to guard endpoints; on frontend to hide/show UI.

### 9.2 Workflow Config

Admins can configure workflows per project or shared across spaces.

Components:

- Status list.
- Transitions (from → to).
- Transition rules (optional advanced):
    - Required fields to move.
    - Only certain roles can execute transition.

---

## 10. Collaboration Features

### 10.1 Comments & Activity Log

Each work item has:

- **Comments**:
    - Plain text + @mentions + attachments.
    - Fields:
        - `id`, `work_item_id`, `author_id`, `body`, `created_at`, `updated_at`.
- **Activity log**:
    - Field changes recorded:
        - Status changes
        - Assignee change
        - Priority changes
        - Sprint assignments
    - Use a `work_item_events` table:
        - `id`, `work_item_id`, `type`, `payload`, `created_at`, `actor_id`.

### 10.2 Notifications

Trigger on:

- @mention in comment
- Work item assigned to user
- Status changed (optional)
- Sprint started/completed

Delivery methods:

- In-app notifications:
    - Notification center in UI.
- Email or push (optional).

Data model:

- `notifications` table:
    - `id`, `user_id`, `type`, `payload`, `read_at`, `created_at`.

---

## 11. Search, Filters, and Saved Views

### 11.1 Search

- Full-text search on:
    - Title, description, comments.
- Filters:
    - Project, type, status, assignee, sprint, labels, custom fields.
- Implementation:
    - Simple approach: DB full-text indices.
    - Advanced: dedicated search engine (Elasticsearch/OpenSearch) if needed.

### 11.2 Filters & Saved Views

- User can create a filter:
    - Example: “My High Priority Bugs this week.”
- Save filter as a named view.
- Each board/list/calendar can be filtered by saved views.

Data model:

- `saved_views`:
    - `id`, `user_id`, `scope` (workspace/space/project), `view_type` (KANBAN, LIST, CALENDAR, TIMELINE), `filters` (JSON), `sort` (JSON), `layout` (JSON).

---

## 12. Application Flow Summary (End-to-End)

1. **User signs up → Creates workspace.**
2. **User creates first space** (e.g. “Engineering”).
3. **User creates first project** in that space:
    - Choose **Scrum** board (sprint-based) or **Kanban**.
4. On a **Scrum board**:
    - **Backlog view**:
        - Create tasks/stories, assign to sprints.
    - **Kanban view**:
        - Initially **locked** because no sprit is active.
        - User goes back to Backlog, creates a sprint, starts it.
    - After sprint start:
        - Kanban unlocks; cards of that sprint appear in columns; drag & drop allowed.
5. User configures:
    - **Custom fields** for project/space (e.g. “Risk Level”).
    - **Custom item types** if needed (“Change Request”).
6. Team uses:
    - **Calendar view** for due dates.
    - **Timeline view** for planning and dependencies.
7. Managers watch:
    - **Workspace dashboard** for global metrics.
    - **Personal dashboard** for own tasks, calendar, notifications.
8. Work item lifecycle:
    - Created → assigned → moved across statuses → optionally split → completed.
    - Everything tracked in activity log & searchable.

---

## 13. Technical Outline (High Level)

You didn’t ask for tech stack specifically, but here’s a concise implementation outline:

- **Backend**:
    - REST or GraphQL API.
    - Core modules:
        - Auth (JWT/session)
        - Workspaces & Users
        - Spaces & Projects
        - Work Items & Workflows
        - Sprints & Boards
        - Custom Fields
        - Views (Kanban, Calendar, Timeline endpoints)
        - Dashboards & Metrics
        - Notifications
- **Database**:
    - Relational (PostgreSQL recommended).
    - Indices:
        - `work_items(project_id, status_id)`
        - `work_items(assignee_id, status_id)`
        - Full-text index on title/description.
- **Frontend**:
    - SPA (React/Next.js).
    - State management for:
        - Current workspace, space, project
        - Active filters
        - Board state (columns, cards, locked flag).
    - Real-time updates via WebSockets or polling (for board moves and notifications).