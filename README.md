# 🚀 Fairlx - Enterprise-Grade Agile Project Management

<div align="center">

<img src="public/Logo.png" alt="Fairlx Logo" width="120" height="120" />

**The Complete Solution for Agile Teams at Scale**

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-FD366E?style=flat&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*A powerful project management platform for modern agile teams: organizations, workspaces, spaces, projects, teams, sprints, work items, workflows, custom fields, time tracking, docs, and integrations.*

[📖 Documentation](#-documentation) | [🚀 Quick Start](#-quick-start) | [🐛 Report Bug](https://github.com/yourorg/Fairlx/issues) | [✨ Request Feature](https://github.com/yourorg/Fairlx/issues)

</div>

---

## 📚 Documentation

<div align="center">
  <table>
    <tr>
      <td align="center" width="25%">
        <a href="#-quick-start"><h3>🚀 Quick Start</h3></a>
        <p>Get up and running fast</p>
      </td>
      <td align="center" width="25%">
        <a href="./APPWRITE_GUIDE.md"><h3>📊 Appwrite Guide</h3></a>
        <p>Complete schema & setup</p>
      </td>
      <td align="center" width="25%">
        <a href="./CONTRIBUTING.md"><h3>🤝 Contributing</h3></a>
        <p>How to contribute</p>
      </td>
      <td align="center" width="25%">
        <a href="./CODE_OF_CONDUCT.md"><h3>📜 Code of Conduct</h3></a>
        <p>Community guidelines</p>
      </td>
    </tr>
  </table>
</div>

---

## ✨ Features

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <h3>🏢 Organizations & Workspaces</h3>
        <p>Personal or Org accounts, multi-workspace, programs, teams, projects</p>
      </td>
      <td align="center" width="33%">
        <h3>📋 Work Items</h3>
        <p>Stories, Tasks, Bugs, Epics with custom fields & workflows</p>
      </td>
      <td align="center" width="33%">
        <h3>🏃 Sprints & Boards</h3>
        <p>Scrum, Kanban, or Hybrid with velocity and burndown</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="33%">
        <h3>🔄 Custom Workflows</h3>
        <p>Status flows, transitions, and rules per workspace/space/project</p>
      </td>
      <td align="center" width="33%">
        <h3>⏱️ Time Tracking</h3>
        <p>Estimates vs actuals, timesheets, capacity insights</p>
      </td>
      <td align="center" width="33%">
        <h3>📎 Files & Docs</h3>
        <p>Attachments (50MB) and project docs (5GB) with previews</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="33%">
        <h3>🤖 AI-Powered</h3>
        <p>Smart suggestions, auto-docs, code analysis, natural language search</p>
      </td>
      <td align="center" width="33%">
        <h3>🐙 GitHub Integration</h3>
        <p>Repo links, commit sync, AI docs, code Q&A</p>
      </td>
      <td align="center" width="33%">
        <h3>💳 Usage-Based Billing</h3>
        <p>Traffic, storage, compute metering with Razorpay</p>
      </td>
    </tr>
  </table>
</div>

---

## 🌟 Why Fairlx?

- **AI-first**: Smart task suggestions, auto-generated documentation, code analysis, and natural language search.
- **Enterprise-ready**: Organizations, multi-workspace, programs, teams, RBAC permissions.
- **Dual account types**: Personal accounts for individuals, Org accounts for teams with shared billing.
- **Production-grade billing**: Usage-based metering (traffic, storage, compute) with Razorpay e-mandate, grace periods, and auto-suspension.
- **Security hardened**: Server-side org derivation, billing enforcement middleware, invariant checks.
- **Flexible workflows**: Workspace/space/project-level customization.
- **Custom fields**: Text, numbers, selects, users, dates, currency, labels.
- **Built-in time tracking**: Estimates vs actuals, timesheets, exports.
- **Integration-ready**: GitHub, AI services, Razorpay, notifications, storage.
- **Self-host friendly**: Appwrite backend; full data ownership.
- **Modern stack**: Next.js 15, TypeScript, Tailwind, Appwrite, Hono.

---

## 🛠️ Tech Stack

**Frontend**: Next.js 15 (App Router, RSC), TypeScript, Tailwind CSS, Radix UI, shadcn/ui, Lucide, React Hook Form, Zod, TanStack Query, React Big Calendar, Recharts, Next Themes, Sonner.

**Backend**: Appwrite (Auth, DB, Storage, Functions, Realtime), Hono for API routes, Next.js Server Actions.

**Tooling**: ESLint, Prettier, TypeScript strict mode, Git.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (npm/yarn/pnpm/bun)
- Appwrite Cloud or self-hosted Appwrite

### Install
```bash
git clone https://github.com/yourorg/Fairlx.git
cd Fairlx
npm install  # or bun install
```

### Configure env
Create `.env.local` with your values:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=your_project_id
NEXT_APPWRITE_KEY=your_api_key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id

# Core Collections
NEXT_PUBLIC_APPWRITE_WORKSPACES_ID=workspaces
NEXT_PUBLIC_APPWRITE_MEMBERS_ID=members
NEXT_PUBLIC_APPWRITE_PROJECTS_ID=projects
NEXT_PUBLIC_APPWRITE_TASKS_ID=tasks
NEXT_PUBLIC_APPWRITE_SPRINTS_ID=sprints
NEXT_PUBLIC_APPWRITE_WORK_ITEMS_ID=work_items
NEXT_PUBLIC_APPWRITE_TIME_LOGS_ID=time_logs
NEXT_PUBLIC_APPWRITE_PERSONAL_BACKLOG_ID=personal_backlog
NEXT_PUBLIC_APPWRITE_CUSTOM_COLUMNS_ID=custom_columns
NEXT_PUBLIC_APPWRITE_DEFAULT_COLUMN_SETTINGS_ID=default_column_settings
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_ID=notifications
NEXT_PUBLIC_APPWRITE_SUBTASKS_ID=subtasks
NEXT_PUBLIC_APPWRITE_ATTACHMENTS_ID=attachments
NEXT_PUBLIC_APPWRITE_COMMENTS_ID=comments
NEXT_PUBLIC_APPWRITE_GITHUB_REPOS_ID=github_repos
NEXT_PUBLIC_APPWRITE_CODE_DOCS_ID=code_docs
NEXT_PUBLIC_APPWRITE_PROJECT_DOCS_ID=project_docs

# Teams & Programs
NEXT_PUBLIC_APPWRITE_TEAMS_ID=teams
NEXT_PUBLIC_APPWRITE_TEAM_MEMBERS_ID=team_members
NEXT_PUBLIC_APPWRITE_PROGRAMS_ID=programs
NEXT_PUBLIC_APPWRITE_CUSTOM_ROLES_ID=custom_roles
NEXT_PUBLIC_APPWRITE_PROJECT_MEMBERS_ID=project_members
NEXT_PUBLIC_APPWRITE_PROJECT_ROLES_ID=project_roles

# Spaces & Workflows
NEXT_PUBLIC_APPWRITE_SPACES_ID=spaces
NEXT_PUBLIC_APPWRITE_SPACE_MEMBERS_ID=space_members
NEXT_PUBLIC_APPWRITE_WORKFLOWS_ID=workflows
NEXT_PUBLIC_APPWRITE_WORKFLOW_STATUSES_ID=workflow_statuses
NEXT_PUBLIC_APPWRITE_WORKFLOW_TRANSITIONS_ID=workflow_transitions

# Custom Fields
NEXT_PUBLIC_APPWRITE_CUSTOM_FIELDS_ID=custom_fields
NEXT_PUBLIC_APPWRITE_CUSTOM_WORK_ITEM_TYPES_ID=custom_work_item_types
NEXT_PUBLIC_APPWRITE_WORK_ITEM_LINKS_ID=work_item_links
NEXT_PUBLIC_APPWRITE_SAVED_VIEWS_ID=saved_views

# Organizations & Billing
NEXT_PUBLIC_APPWRITE_ORGANIZATIONS_ID=organizations
NEXT_PUBLIC_APPWRITE_ORGANIZATION_MEMBERS_ID=organization_members
NEXT_PUBLIC_APPWRITE_ORGANIZATION_AUDIT_LOGS_ID=organization_audit_logs
NEXT_PUBLIC_APPWRITE_USAGE_EVENTS_ID=usage_events
NEXT_PUBLIC_APPWRITE_USAGE_AGGREGATIONS_ID=usage_aggregations
NEXT_PUBLIC_APPWRITE_USAGE_ALERTS_ID=usage_alerts
NEXT_PUBLIC_APPWRITE_STORAGE_SNAPSHOTS_ID=storage_snapshots
NEXT_PUBLIC_APPWRITE_INVOICES_ID=invoices
NEXT_PUBLIC_APPWRITE_BILLING_ACCOUNTS_ID=billing_accounts
NEXT_PUBLIC_APPWRITE_BILLING_AUDIT_LOGS_ID=billing_audit_logs
NEXT_PUBLIC_APPWRITE_PROCESSED_EVENTS_ID=processed_events

# Razorpay (for billing)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Billing Configuration
BILLING_GRACE_PERIOD_DAYS=14
BILLING_CURRENCY=INR

# Storage Buckets
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=images
NEXT_PUBLIC_APPWRITE_ATTACHMENTS_BUCKET_ID=attachments_bucket
NEXT_PUBLIC_APPWRITE_PROJECT_DOCS_BUCKET_ID=project-docs

# Email Configuration
NEXT_PUBLIC_APPWRITE_SMTP_PROVIDER_ID=your_smtp_provider_id
NEXT_PUBLIC_APPWRITE_EMAIL_TOPIC_ID=your_email_topic_id
```

> Full schema and bucket details: see [APPWRITE_GUIDE.md](./APPWRITE_GUIDE.md).

### Run
```bash
npm run dev   # or bun dev
# open http://localhost:3000
```

---

## 📁 Project Structure

```
Fairlx/
├── public/                # Static assets
├── docs/                  # Documentation
├── src/
│   ├── app/               # Next.js App Router (auth, dashboard, api, oauth)
│   ├── components/        # UI & shared components
│   ├── features/          # Feature modules:
│   │   ├── auth/          # Authentication, signup, login, email verification
│   │   ├── organizations/ # Organization management & billing
│   │   ├── workspaces/    # Workspace CRUD
│   │   ├── spaces/        # Spaces (project containers)
│   │   ├── projects/      # Projects
│   │   ├── tasks/         # Tasks & work items
│   │   ├── sprints/       # Sprint management
│   │   ├── teams/         # Teams
│   │   ├── programs/      # Programs
│   │   ├── members/       # Workspace membership
│   │   ├── workflows/     # Custom workflows
│   │   ├── custom-fields/ # Custom fields
│   │   ├── time-logs/     # Time tracking
│   │   ├── comments/      # Comments
│   │   ├── attachments/   # File attachments
│   │   ├── notifications/ # Notification system
│   │   ├── github-integration/ # GitHub repo sync
│   │   └── ...            # Additional features
│   ├── hooks/             # Reusable hooks
│   ├── lib/               # Appwrite client, RPC, utils, session middleware
│   ├── schemas/           # Zod validation schemas
│   ├── types/             # Shared types
│   └── config.ts          # Environment config constants
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── APPWRITE_GUIDE.md
├── components.json
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## 🎯 Core Features (Detail)

### Account Types
- **Personal Account**: Single-user workspace with personal billing
- **Organization Account**: Multi-workspace teams with shared org-level billing

### Organization Hierarchy
```
Organization (Org Account only)
└── Workspaces
    ├── Spaces
    │   └── Work Items
    ├── Projects
    │   ├── Sprints
    │   └── Tasks
    └── Teams & Programs
```

### Key Capabilities
- **Boards**: Scrum, Kanban, Hybrid; WIP limits; swimlanes; sprint metrics.
- **Workflows**: Custom statuses and transitions per scope; rules, allowed roles, auto-assign.
- **Work Items**: Stories/Tasks/Bugs/Epics/Subtasks; labels; components; relationships (blocks, relates, duplicates, split, clone, parent/child, causes).
- **Custom Fields**: Text, number, date/time, select/multi-select, user(s), checkbox, URL, email, currency, percentage, labels; scope to workspace/space/project.
- **Time Tracking**: Estimates vs actuals; per-user timesheets; capacity/velocity; exports.
- **Docs & Files**: Attachments up to 50MB; project docs up to 5GB with categories (PRD/FRD/spec/etc.).
- **Comments**: Threaded, @mentions, edit flag, reply chains.
- **Notifications**: Assignments, status/priority/due changes, comments, attachments.
- **GitHub Integration**: Repo links, commit sync, generated docs, Q&A.
- **Timeline & Calendar**: Gantt-style timelines, calendar for due dates/milestones.
- **Analytics**: Burndown, velocity, workload, project progress, risk signals.
- **Security**: RBAC, space visibility, file validation, email verification.

### 🤖 AI Features
- **Smart Task Suggestions**: AI analyzes project context to suggest task breakdowns, estimates, and assignees.
- **Auto-Generated Documentation**: Automatically generate PRDs, technical specs, and release notes from project data.
- **Code Analysis & Q&A**: Ask questions about your codebase; AI provides answers with file references.
- **Natural Language Search**: Find tasks, docs, and code using plain English queries.
- **Sprint Planning Assistant**: AI recommends sprint capacity, identifies risks, and suggests task prioritization.
- **Commit Summarization**: Auto-generate meaningful commit summaries and changelog entries.
- **Duplicate Detection**: AI identifies potentially duplicate tasks and suggests merging.
- **Effort Estimation**: ML-powered story point and time estimates based on historical data.
- **Risk Prediction**: Proactive alerts for scope creep, deadline risks, and blockers.

---

## 🔧 Development

**Scripts**
```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # start production
npm run lint     # lint
```

**Guidelines**
- TypeScript strict; explicit types.
- Prefer Server Components; use client components only when needed.
- Use Tailwind utilities and shadcn/ui primitives.
- Validate inputs with Zod; keep components small and composable.
- Use route utilities (`src/lib/route-utils.ts`) for safe navigation with ID validation.
- Run lint before pushing.

**Example**
```typescript
import { buildWorkspaceRoute } from "@/lib/route-utils";

// Safe navigation with validated IDs
const route = buildWorkspaceRoute(workspaceId, "/settings");
router.push(route);
```

---

## 🚀 Deployment

**Vercel (recommended)**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourorg/Fairlx)

1) Import repo to Vercel
2) Set env vars (see `.env.local`)
3) Deploy

**Docker (example)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🗺️ Roadmap

**Completed**: 
- Multi-workspace & organizations
- Scrum/Kanban/Hybrid boards
- Custom workflows & fields
- Time tracking
- Teams & programs
- Work item links
- GitHub integration
- Comments & attachments
- Notifications
- Timelines & analytics
- **Production-grade usage-based billing** (traffic, storage, compute metering)
- **Razorpay e-mandate integration** (auto-debit, grace periods, suspension)
- Dual account types (Personal/Org)
- **Billing enforcement middleware** (mutation guards, suspension blocks)
- **Billing UX components** (explainer, timeline, suspension screen)
- **Developer documentation** for billing invariants

**In Progress**: 
- Advanced reporting dashboard
- Automation rules
- Webhooks
- Mobile app

**Planned**: 
- Jira import/export
- Slack/Discord/Teams integration
- Approvals
- Capacity planning
- Portfolio management
- AI insights
- Custom widgets
- i18n
- Advanced search
- Bulk operations
- 2FA

---

## 📊 Database Snapshot

- **Collections**: 30+ (workspaces, spaces, space_members, programs, teams, team_members, custom_roles, projects, members, tasks, work_items, sprints, workflows, workflow_statuses, workflow_transitions, custom_columns, default_column_settings, time_logs, subtasks, comments, attachments, notifications, personal_backlog, github_repos, code_docs, project_docs, organizations, organization_members, usage_events, invoices, etc.)
- **Buckets**: 3 (images, attachments_bucket, project-docs)

Full attribute list, types, required flags, lengths, and indexes: see [APPWRITE_GUIDE.md](./APPWRITE_GUIDE.md).

---

## 🔐 Security

- Email verification required (configure SMTP provider & topic in Appwrite).
- RBAC via workspace/member roles and custom team roles.
- Organization-level permissions and audit logs.
- **Billing enforcement**: `mutationGuard` middleware blocks writes for suspended accounts.
- **Server-side org derivation**: Never trusts client-provided organization IDs.
- **Webhook signature verification**: Razorpay webhooks verified before processing.
- **Idempotency**: Processed events registry prevents duplicate billing operations.
- Data encrypted at rest/in transit; secure sessions.
- File validation on uploads; antivirus enabled on buckets (Appwrite settings).
- Route utilities prevent navigation with undefined/invalid IDs.
- Report vulnerabilities privately (not via public issues).

> 📖 See [`md/BILLING_INVARIANTS.md`](./md/BILLING_INVARIANTS.md) for billing system invariants and security patterns.

---

## 🙏 Acknowledgments

- [Vercel](https://vercel.com)
- [Appwrite](https://appwrite.io)
- [Radix UI](https://www.radix-ui.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query)
- [Hono](https://hono.dev)

## 💬 Community & Support
- Docs: [APPWRITE_GUIDE.md](./APPWRITE_GUIDE.md)
- Issues: [Bugs](https://github.com/yourorg/Fairlx/issues/new?labels=bug) | [Features](https://github.com/yourorg/Fairlx/issues/new?labels=enhancement)
- Discussions: [GitHub Discussions](https://github.com/yourorg/Fairlx/discussions)

<div align="center">

**Built with ❤️ for Agile Teams** — ⭐ us if this helps!

</div>
