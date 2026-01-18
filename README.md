<div align="center">

# Fairlx

### Enterprise-Grade Agile Project Management Platform

<br />

<img src="public/Logo.png" alt="Fairlx Logo" width="100" height="100" />

<br />
<br />

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-FD366E?style=for-the-badge&logo=appwrite&logoColor=white)](https://appwrite.io/)

<br />

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

<br />

A comprehensive project management solution built for modern agile teams.  
Organizations, workspaces, custom workflows, AI-powered insights, and more.

<br />

[Get Started](#-quick-start) · [Documentation](#-documentation) · [Report Bug](https://github.com/stemlen/Fairlx/issues) · [Request Feature](https://github.com/stemlen/Fairlx/issues)

</div>

<br />

---

<br />

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

<br />

## 🎯 Overview

Fairlx is an enterprise-ready agile project management platform designed to help teams of all sizes manage their work effectively. Built with modern technologies and best practices, it offers a complete solution for project planning, tracking, and collaboration.

### Why Fairlx?

| | |
|---|---|
| **🤖 AI-First** | Workflow AI assistant, smart suggestions, auto-generated documentation |
| **🏢 Enterprise-Ready** | Organizations, multi-workspace, programs, teams, RBAC permissions |
| **💳 Production Billing** | Usage-based metering with Razorpay integration |
| **🔐 Security Hardened** | Server-side validation, billing enforcement, invariant checks |
| **🔄 Flexible Workflows** | Customizable at workspace, space, and project levels |
| **📦 Self-Host Friendly** | Full data ownership with Appwrite backend |

<br />

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### Core Management
- **Organizations & Workspaces**  
  Multi-tenant with billing scopes
- **Spaces & Projects**  
  Logical containers with visibility controls
- **Teams & Programs**  
  Cross-functional collaboration

</td>
<td width="33%" valign="top">

### Work Items
- **Tasks, Stories, Bugs, Epics**  
  Full work item lifecycle
- **Custom Fields**  
  10+ field types including labels & currency
- **Subtasks & Links**  
  8 relationship types

</td>
<td width="33%" valign="top">

### Planning
- **Sprints & Boards**  
  Scrum, Kanban, or Hybrid
- **Time Tracking**  
  Estimates vs actuals with timesheets
- **Timeline Views**  
  Gantt-style with zoom levels

</td>
</tr>
<tr>
<td width="33%" valign="top">

### Workflows
- **Custom Statuses**  
  Define your own workflow
- **Transition Rules**  
  Control state changes
- **AI Assistant**  
  Analyze and optimize workflows

</td>
<td width="33%" valign="top">

### Collaboration
- **Comments & Mentions**  
  Threaded discussions
- **Attachments**  
  Up to 50MB per file
- **Project Docs**  
  PRDs, specs with AI chat

</td>
<td width="33%" valign="top">

### Integrations
- **GitHub**  
  Repo linking, commit sync
- **AI Services**  
  Google Gemini integration
- **Notifications**  
  Real-time updates

</td>
</tr>
</table>

<br />

## 🛠 Tech Stack

| Layer | Technologies |
|:------|:-------------|
| **Frontend** | Next.js 15, React, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Appwrite (Auth, Database, Storage), Hono |
| **State** | TanStack Query, Zod |
| **AI** | Google Gemini API |
| **Payments** | Razorpay |
| **Testing** | Vitest, Playwright |

<br />

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Appwrite instance (Cloud or self-hosted)
- Gemini API key (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/stemlen/Fairlx.git
cd Fairlx

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file with the following required variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_APPWRITE_KEY=your_api_key

# AI Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Razorpay (Optional, for billing)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

> See [APPWRITE_SETUP.md](./md/APPWRITE_SETUP.md) for complete environment configuration.

<br />

## 📁 Project Structure

```
fairlx/
├── public/                    # Static assets
├── docs/                      # Documentation
├── md/                        # Setup guides
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Main application
│   │   ├── (standalone)/      # Standalone pages
│   │   └── api/               # API routes (Hono)
│   ├── components/            # Shared components
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── skeletons/         # Loading states
│   ├── features/              # Feature modules
│   │   ├── auth/              # Authentication
│   │   ├── workspaces/        # Workspace management
│   │   ├── projects/          # Project management
│   │   ├── tasks/             # Work items
│   │   ├── workflows/         # Custom workflows
│   │   └── ...                # 35+ feature modules
│   ├── hooks/                 # Shared React hooks
│   ├── lib/                   # Core utilities
│   └── types/                 # TypeScript definitions
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

<br />

## 📚 Documentation

| Document | Description |
|:---------|:------------|
| [Appwrite Guide](./md/APPWRITE_GUIDE.md) | Complete database schema and setup |
| [Appwrite Setup](./md/APPWRITE_SETUP.md) | Step-by-step Appwrite configuration |
| [Spaces Guide](./docs/SPACES_GUIDE.md) | Understanding spaces and containers |
| [Contributing](./CONTRIBUTING.md) | Contribution guidelines |
| [Code of Conduct](./CODE_OF_CONDUCT.md) | Community guidelines |

<br />

## 🔐 Permission System

Fairlx implements hierarchical Role-Based Access Control (RBAC):

```
Organization
├── Owner        Full control, billing
├── Admin        Manage members, settings
├── Moderator    Manage content
└── Member       Basic access
    │
    └── Workspace
        ├── Admin    Full workspace control
        ├── Editor   Edit content
        └── Viewer   Read-only
            │
            └── Space → Project → Team
```

<br />

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/stemlen/Fairlx)

### Docker

```bash
docker build -t fairlx .
docker run -p 3000:3000 fairlx
```

### Manual

```bash
npm run build
npm start
```

<br />

## 🧪 Development

```bash
# Development
npm run dev

# Type checking
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Production build
npm run build
```

<br />

## 🗺 Roadmap

- [x] Multi-workspace organizations
- [x] Custom workflows with AI
- [x] GitHub integration
- [x] Usage-based billing
- [x] Spaces and containers
- [ ] Advanced reporting
- [ ] Automation rules
- [ ] Mobile application
- [ ] Jira import/export
- [ ] Slack/Teams integration

<br />

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<br />

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

<br />

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Appwrite](https://appwrite.io) - Backend services
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Hono](https://hono.dev) - API framework

<br />

---

<div align="center">

**Built with ❤️ for agile teams everywhere**

<br />

[⬆ Back to Top](#fairlx)

</div>
