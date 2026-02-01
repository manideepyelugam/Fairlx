# 🚀 Fairlx - Enterprise-Grade Agile Project Management Platform

<div align="center">

<img src="public/Logo.png" alt="Fairlx Logo" width="120" height="120" />

**Complete Agile Management Solution for Modern Teams**

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-FD366E?style=flat&logo=appwrite&logoColor=white)](https://appwrite.io/)

*Production-ready platform with organizations, workspaces, spaces, projects, teams, sprints, custom workflows, AI assistance, usage-based billing, and GitHub integration.*

[📖 Guides](#-documentation) | [🚀 Setup](#-quick-start-guide) | [💡 Contribute](CONTRIBUTING.md) | [🏗️ Architecture](#-architecture--data-flow)

</div>

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Documentation](#-documentation)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Quick Start Guide](#-quick-start-guide)
- [Architecture & Data Flow](#-architecture--data-flow)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Feature Modules](#-feature-modules)
- [Permission & RBAC System](#-permission--rbac-system)
- [Billing & Usage Tracking](#-billing--usage-tracking)
- [AI Features](#-ai-features)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Security](#-security)

---

## 🎯 Overview

Fairlx is an enterprise-ready project management platform built with Next.js 15, TypeScript, and Appwrite. It provides a complete agile workflow solution with:

- **Dual account types**: Personal accounts for individuals, Organization accounts for teams with shared billing
- **Hierarchical organization**: Organizations → Workspaces → Spaces → Projects → Tasks/Work Items
- **Flexible workflows**: Custom statuses, transitions, and AI-powered workflow assistance
- **Production-grade billing**: Usage-based metering with Razorpay integration and automated billing cycles
- **Advanced RBAC**: Multi-level role-based access control across organizations, workspaces, spaces, projects, and teams
- **AI integration**: Gemini-powered workflow suggestions, code analysis, and documentation generation
- **GitHub sync**: Repository linking with AI-generated documentation and commit tracking

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [README.md](README.md) | This file - complete setup and overview |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow and contribution guidelines |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards and conduct |
| [changelog.md](changelog.md) | Detailed changelog of all updates |
| [DATABASE_UPDATES.md](DATABASE_UPDATES.md) | Database schema changes and migrations |
| [PROGRAMS_IMPLEMENTATION_GUIDE.md](PROGRAMS_IMPLEMENTATION_GUIDE.md) | Programs feature implementation details |
| [md/APPWRITE_SETUP.md](md/APPWRITE_SETUP.md) | Appwrite database and collections setup |
| [md/APPWRITE_GUIDE.md](md/APPWRITE_GUIDE.md) | Complete Appwrite schema reference |
| [md/MIGRATION_SETUP.md](md/MIGRATION_SETUP.md) | Migration scripts and procedures |
| [docs/FEATURES_COMPLETE.md](docs/FEATURES_COMPLETE.md) | Implementation summary of all features |
| [docs/SPACES_GUIDE.md](docs/SPACES_GUIDE.md) | Visual guide to Spaces feature |
| [docs/SPACES_TESTING_GUIDE.md](docs/SPACES_TESTING_GUIDE.md) | Spaces testing procedures |

---

## ✨ Features Overview

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <h3>🏢 Organizations & Workspaces</h3>
        <p>Personal or Org accounts, multi-workspace, programs, teams, projects with spaces</p>
      </td>
      <td align="center" width="33%">
        <h3>📋 Work Items</h3>
        <p>Stories, Tasks, Bugs, Epics, Subtasks with custom fields, labels & workflows</p>
      </td>
      <td align="center" width="33%">
        <h3>🏃 Sprints & Boards</h3>
        <p>Scrum, Kanban, or Hybrid with WIP limits, velocity and burndown</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="33%">
        <h3>🔄 Custom Workflows</h3>
        <p>Status flows, transitions, rules per workspace/space/project with AI assistant</p>
      </td>
      <td align="center" width="33%">
        <h3>⏱️ Time Tracking</h3>
        <p>Estimates vs actuals, timesheets, capacity insights, variance tracking</p>
      </td>
      <td align="center" width="33%">
        <h3>📎 Files & Docs</h3>
        <p>Attachments (50MB) and project docs (5GB) with categories & AI</p>
      </td>
    </tr>
    <tr>
      <td align="center" width="33%">
        <h3>🤖 AI-Powered</h3>
        <p>Workflow AI, smart suggestions, auto-docs, code analysis, Q&A</p>
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

| Feature | Description |
|---------|-------------|
| **AI-first** | Workflow AI assistant, smart task suggestions, auto-generated documentation, code analysis |
| **Enterprise-ready** | Organizations, multi-workspace, programs, teams, RBAC permissions |
| **Dual account types** | Personal accounts for individuals, Org accounts for teams with shared billing |
| **Production-grade billing** | Usage-based metering with Razorpay e-mandate, grace periods, auto-suspension |
| **Security hardened** | Server-side org derivation, billing enforcement middleware, invariant checks |
| **Flexible workflows** | Workspace/space/project-level customization with AI-powered transitions |
| **Custom fields** | Text, numbers, selects, users, dates, currency, labels, percentage |
| **Built-in time tracking** | Estimates vs actuals, timesheets, exports |
| **Integration-ready** | GitHub, AI services, Razorpay, notifications, storage |
| **Self-host friendly** | Appwrite backend; full data ownership |
| **Modern stack** | Next.js 15, TypeScript, Tailwind, Appwrite, Hono, Gemini AI |

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 15 (App Router, RSC), TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons |
| **Backend** | Appwrite (Auth, DB, Storage, Realtime), Hono (API routes) |
| **State/Data** | TanStack Query (React Query), Zod validation |
| **AI** | Google Gemini API (gemini-2.5-flash-lite) |
| **UI Libraries** | React Hook Form, React Big Calendar, Recharts, @xyflow/react |
| **Payments** | Razorpay (e-mandate, auto-debit) |
| **Exports** | jsPDF, docx, html-to-docx |
| **Testing** | Vitest, Playwright |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (npm/yarn/pnpm/bun)
- Appwrite Cloud or self-hosted Appwrite
- Gemini API key (for AI features)
- Razorpay account (for billing, optional)

### Install
```bash
git clone https://github.com/stemlen/Fairlx.git
cd Fairlx
npm install  # or bun install
```

### Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=your_project_id
NEXT_APPWRITE_KEY=your_api_key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Core Collections (see docs/APPWRITE_SETUP.md for full list)
NEXT_PUBLIC_APPWRITE_WORKSPACES_ID=workspaces
NEXT_PUBLIC_APPWRITE_MEMBERS_ID=members
NEXT_PUBLIC_APPWRITE_PROJECTS_ID=projects
NEXT_PUBLIC_APPWRITE_TASKS_ID=tasks
NEXT_PUBLIC_APPWRITE_SPACES_ID=spaces
NEXT_PUBLIC_APPWRITE_WORKFLOWS_ID=workflows
NEXT_PUBLIC_APPWRITE_WORKFLOW_STATUSES_ID=workflow_statuses
NEXT_PUBLIC_APPWRITE_WORKFLOW_TRANSITIONS_ID=workflow_transitions
# ... (see md/APPWRITE_SETUP.md for complete list)

# Razorpay (optional, for billing)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Storage Buckets
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=images
NEXT_PUBLIC_APPWRITE_ATTACHMENTS_BUCKET_ID=attachments_bucket
NEXT_PUBLIC_APPWRITE_PROJECT_DOCS_BUCKET_ID=project-docs
```

> Full schema and bucket details: see [md/APPWRITE_GUIDE.md](./md/APPWRITE_GUIDE.md).

### Run
```bash
npm run dev   # or bun dev
# open http://localhost:3000
```

---

## 📁 Project Structure

```
Fairlx/
├── public/                    # Static assets (logo, icons)
├── docs/                      # Documentation
│   ├── APPWRITE_ORGANIZATIONS_SETUP.md
│   ├── DATABASE_UPDATES.md
│   ├── FEATURES_COMPLETE.md
│   ├── SPACES_GUIDE.md
│   └── SPACES_TESTING_GUIDE.md
├── md/                        # Additional guides
│   ├── APPWRITE_GUIDE.md
│   ├── APPWRITE_SETUP.md
│   └── MIGRATION_SETUP.md
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up, verify)
│   │   ├── (dashboard)/       # Dashboard routes
│   │   │   └── workspaces/    # Workspace, spaces, projects, tasks
│   │   ├── (standalone)/      # Standalone pages
│   │   ├── api/               # API routes (Hono)
│   │   ├── auth/              # Auth callbacks
│   │   └── oauth/             # OAuth handling
│   ├── components/            # Shared components
│   │   ├── ui/                # shadcn/ui primitives (34 components)
│   │   ├── skeletons/         # Loading skeletons
│   │   └── *.tsx              # App-specific components
│   ├── features/              # Feature modules (35 features)
│   │   ├── auth/              # Authentication
│   │   ├── organizations/     # Organizations & billing
│   │   ├── workspaces/        # Workspace management
│   │   ├── spaces/            # Spaces (containers)
│   │   ├── projects/          # Project management
│   │   ├── tasks/             # Tasks & work items
│   │   ├── workflows/         # Custom workflows + AI
│   │   ├── teams/             # Team management
│   │   └── ...                # (see Feature Modules section)
│   ├── hooks/                 # Shared hooks
│   │   ├── use-confirm.tsx
│   │   ├── use-debounce.ts
│   │   └── use-permission.ts
│   ├── lib/                   # Core utilities
│   │   ├── appwrite.ts        # Appwrite clients
│   │   ├── session-middleware.ts
│   │   ├── rbac.ts            # Role-based access
│   │   ├── permissions.ts     # Permission constants
│   │   ├── billing-*.ts       # Billing utilities
│   │   ├── usage-*.ts         # Usage metering
│   │   └── utils.ts           # General utilities
│   ├── types/                 # Shared TypeScript types
│   └── config.ts              # Environment config
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── DATABASE_UPDATES.md
├── workflow.md
├── components.json            # shadcn/ui config
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 📦 Feature Modules (35 Features)

Each feature module follows a consistent structure:
```
feature/
├── api/           # TanStack Query hooks (queries & mutations)
├── components/    # React components
├── hooks/         # Feature-specific hooks
├── server/        # Hono API routes
├── types/         # TypeScript types
└── schemas.ts     # Zod validation schemas
```

### Core Entity Management

| Feature | Description |
|---------|-------------|
| **auth** | Sign-in/up, email verification, OAuth (Google, GitHub), forgot/reset password |
| **organizations** | Organization management, multi-workspace support, billing, soft-delete |
| **workspaces** | Workspace CRUD with UI modes (Simple/Advanced), billing scope |
| **spaces** | Logical containers between workspace and projects with visibility controls |
| **projects** | Board types (Scrum/Kanban/Hybrid), WIP limits, sprint settings, GitHub integration |
| **programs** | Cross-team program management with leads and status tracking |

### Work Item Management

| Feature | Description |
|---------|-------------|
| **tasks** | Work items with priority, status, assignees, teams, story points, labels, custom fields |
| **sprints** | Sprint planning (Planned/Active/Completed/Cancelled), velocity tracking, burndown |
| **subtasks** | Subtask management with priority, due dates, assignees |
| **work-item-links** | Relationships: blocks, relates, duplicates, split, clone, parent/child, causes |
| **personal-backlog** | Personal backlog items (Stories, Bugs, Tasks, Epics, Ideas, Improvements) |

### Team & Member Management

| Feature | Description |
|---------|-------------|
| **members** | Workspace membership with roles (Owner, Admin, Member) |
| **teams** | Team management with visibility, roles (Lead/Member/Custom), granular permissions |
| **project-members** | Project-scoped membership and roles |
| **roles** | Custom role definitions with permission sets |
| **org-permissions** | Organization-level role management (Owner, Admin, Moderator, Member) |
| **user-access** | User access control and permissions |

### Customization Features

| Feature | Description |
|---------|-------------|
| **workflows** | Custom statuses, transitions, rules + **AI Assistant** for workflow building |
| **custom-fields** | Text, number, date, select/multi-select, user, checkbox, URL, currency, percentage, labels |
| **custom-columns** | Custom kanban columns with icons and colors |
| **default-column-settings** | Default column configurations |
| **saved-views** | Saved views for Kanban/List/Calendar/Timeline with filters and sorting |

### Time & Planning

| Feature | Description |
|---------|-------------|
| **time-tracking** | Time logs, estimates vs actuals, timesheets, variance tracking |
| **timeline** | Gantt-style timeline view with zoom levels and epic grouping |

### Collaboration Features

| Feature | Description |
|---------|-------------|
| **comments** | Threaded comments with @mentions and edit tracking |
| **attachments** | File attachments (up to 50MB) with preview support |
| **project-docs** | Documentation (PRD, FRD, Technical Spec, API Docs) up to 5GB with AI chat |
| **notifications** | Real-time notifications for assignments, status changes, comments |

### Integration & Analytics

| Feature | Description |
|---------|-------------|
| **github-integration** | GitHub repo linking, commit sync, AI-generated code docs, Q&A |
| **audit-logs** | Activity logging and audit trails |
| **usage** | Usage metering (traffic, storage, compute) for billing |
| **billing** | Billing accounts, invoices, payment status, grace periods, suspension |
| **currency** | Multi-currency support |
| **onboarding** | User onboarding flow and hooks |

---

## 🔐 Permission System

Fairlx implements a hierarchical RBAC (Role-Based Access Control) system:

```
Organization (Org Account only)
├── OWNER      - Full control, billing management, delete org
├── ADMIN      - Manage members, settings, workspaces
├── MODERATOR  - Manage content, limited member management
└── MEMBER     - Basic access

└── Workspace
    ├── WS_ADMIN   - Full workspace control
    ├── WS_EDITOR  - Edit content, manage projects
    └── WS_VIEWER  - Read-only access

    └── Space
        ├── ADMIN/MASTER - Full space control
        ├── MEMBER       - Standard access
        └── VIEWER       - Read-only access

        └── Project
            ├── PROJECT_ADMIN - Full project control
            ├── MANAGER       - Manage sprints, assign tasks
            ├── DEVELOPER     - Work on tasks
            └── VIEWER        - Read-only access

            └── Team
                ├── LEAD   - Team lead permissions
                ├── MEMBER - Team member permissions
                └── CUSTOM - Custom role permissions
```

### Key Permission Files
- `src/lib/permissions.ts` - Permission constants
- `src/lib/permission-matrix.ts` - Permission matrix definitions
- `src/lib/rbac.ts` - RBAC implementation
- `src/lib/project-rbac.ts` - Project-level RBAC
- `src/components/permission-guard.tsx` - React permission guard

---

## 🤖 AI Features

Fairlx integrates **Google Gemini AI** for intelligent assistance:

### Workflow AI Assistant
- **Analyze Workflows**: Identify orphaned, unreachable, and dead-end statuses
- **Suggest Statuses**: AI recommends new statuses based on workflow context
- **Suggest Transitions**: AI recommends transitions with conditions and rules
- **Generate Templates**: Generate complete workflow templates from prompts
- **Q&A**: Ask questions about your workflow structure

### Project Docs AI
- **Auto-Generated Documentation**: Generate PRDs, technical specs from project context
- **Code Analysis & Q&A**: Ask questions about your codebase with file references
- **Commit Summarization**: Auto-generate meaningful commit summaries

### Smart Features
- **Duplicate Detection**: AI identifies potentially duplicate tasks
- **Risk Prediction**: Proactive alerts for scope creep, deadline risks
- **Sprint Planning Assistant**: AI recommends capacity and prioritization

---

## 🔧 Development

### Scripts
```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run Vitest
npm run test:run   # Vitest single run
```

### Guidelines
- TypeScript strict mode; explicit types
- Prefer Server Components; use client components only when needed
- Use Tailwind utilities and shadcn/ui primitives
- Validate inputs with Zod at API boundaries
- Use route utilities (`src/lib/route-utils.ts`) for safe navigation
- Run lint before pushing

### Example: Safe Navigation
```typescript
import { buildWorkspaceRoute } from "@/lib/route-utils";

// Safe navigation with validated IDs
const route = buildWorkspaceRoute(workspaceId, "/settings");
router.push(route);
```

### Feature Module Pattern
```typescript
// api/use-get-feature.ts
export const useGetFeature = (id: string) => {
  return useQuery({
    queryKey: ["feature", id],
    queryFn: async () => {
      const response = await client.api.feature[":id"].$get({ param: { id } });
      return response.json();
    },
  });
};

// server/route.ts
const app = new Hono()
  .get("/:id", sessionMiddleware, async (c) => {
    const { id } = c.req.param();
    // ... implementation
    return c.json({ data });
  });
```

---

## 🚀 Deployment

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/stemlen/Fairlx)

1. Import repo to Vercel
2. Set environment variables
3. Deploy

### Docker
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

### ✅ Completed
- Multi-workspace & organizations
- Scrum/Kanban/Hybrid boards
- Custom workflows with AI assistant
- Custom fields (10+ types)
- Time tracking with timesheets
- Teams & programs
- Work item links (8 relationship types)
- GitHub integration with AI docs
- Comments & attachments
- Notifications
- Timelines & analytics
- Production-grade usage-based billing
- Razorpay e-mandate integration
- Dual account types (Personal/Org)
- Billing enforcement middleware
- Spaces (logical containers)

### 🚧 In Progress
- Advanced reporting dashboard
- Automation rules
- Webhooks

### 📋 Planned
- Mobile app
- Jira import/export
- Slack/Discord/Teams integration
- Approvals workflow
- Capacity planning
- Portfolio management
- Custom widgets
- i18n (internationalization)
- Advanced search
- Bulk operations
- 2FA

---

## 📊 Database Overview

- **Collections**: 35+ (workspaces, spaces, space_members, programs, teams, team_members, custom_roles, projects, members, tasks, work_items, sprints, workflows, workflow_statuses, workflow_transitions, custom_columns, default_column_settings, time_logs, subtasks, comments, attachments, notifications, personal_backlog, github_repos, code_docs, project_docs, organizations, organization_members, usage_events, invoices, etc.)
- **Buckets**: 3 (images, attachments_bucket, project-docs)

Full attribute list, types, and indexes: see [md/APPWRITE_GUIDE.md](./md/APPWRITE_GUIDE.md).

---

## 🔐 Security

| Feature | Description |
|---------|-------------|
| **Email Verification** | Required for account access |
| **RBAC** | Multi-level role-based access control |
| **Billing Enforcement** | `mutationGuard` middleware blocks writes for suspended accounts |
| **Server-side Org Derivation** | Never trusts client-provided organization IDs |
| **Webhook Verification** | Razorpay webhooks verified before processing |
| **Idempotency** | Processed events registry prevents duplicate operations |
| **Data Encryption** | At rest and in transit |
| **File Validation** | Upload validation; antivirus enabled on buckets |
| **Route Guards** | Prevent navigation with undefined/invalid IDs |

> Report vulnerabilities privately (not via public issues).

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- [Vercel](https://vercel.com)
- [Appwrite](https://appwrite.io)
- [Radix UI](https://www.radix-ui.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query)
- [Hono](https://hono.dev)
- [Google Gemini](https://ai.google.dev)

---

## 💬 Community & Support

- **Docs**: [md/APPWRITE_GUIDE.md](./md/APPWRITE_GUIDE.md)
- **Issues**: [Bugs](https://github.com/stemlen/Fairlx/issues/new?labels=bug) | [Features](https://github.com/stemlen/Fairlx/issues/new?labels=enhancement)
- **Discussions**: [GitHub Discussions](https://github.com/stemlen/Fairlx/discussions)

---

<div align="center">

**Built with ❤️ for Agile Teams**

⭐ Star us on GitHub if this helps!

</div>
