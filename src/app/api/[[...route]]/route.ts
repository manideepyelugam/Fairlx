import { Hono } from "hono";
import { handle } from "hono/vercel";

import auth from "@/features/auth/server/route";
import members from "@/features/members/server/route";
import workspaces from "@/features/workspaces/server/route";
import projects from "@/features/projects/server/route";
import tasks from "@/features/tasks/server/route";
import timeLogs from "@/features/time-tracking/server/route";
import customColumns from "@/features/custom-columns/api/route";
import defaultColumnSettings from "@/features/default-column-settings/api/route";
import attachments from "@/features/attachments/api/route";
import notifications from "@/features/notifications/server/route";
import sprints from "@/features/sprints/server/route";
import workItems from "@/features/sprints/server/work-items-route";
import personalBacklog from "@/features/personal-backlog/server/route";
import githubIntegration from "@/features/github-integration/server/index";
import auditLogs from "@/features/audit-logs/api/route";
import subtasks from "@/features/subtasks/server/route";
import teams from "@/features/teams/server/route";
import programs from "@/features/programs/server/route";
import comments from "@/features/comments/api/route";
import projectDocs from "@/features/project-docs/server/route";
// New Jira-like features
import spaces from "@/features/spaces/server/route";
import workflows from "@/features/workflows/server/route";
import workflowAI from "@/features/workflows/server/ai-route";
import customFields from "@/features/custom-fields/server/route";
import workItemLinks from "@/features/work-item-links/server/route";
import savedViews from "@/features/saved-views/server/route";
import roles from "@/features/roles/server/route";
// Project-scoped RBAC
import projectMembers from "@/features/project-members/server/route";
// Usage-Based Billing
import usage from "@/features/usage/server/route";
// Organizations & Account Management
import organizations from "@/features/organizations/server/route";
// Billing & Payment
import billing from "@/features/billing/server/route";
import webhooks from "@/features/billing/server/webhook";
import cron from "@/features/billing/server/cron";
// Currency Conversion
import currency from "@/features/currency/server/route";
// Departments (org-level grouping)
import departments from "@/features/departments/server/route";
// Org Permissions (explicit per-user)
import orgPermissions from "@/features/org-permissions/server/route";
// User Access (permission-driven navigation)
import userAccess from "@/features/user-access/server/route";
// Wallet & Billing Mode
import wallet from "@/features/wallet/server/route";
import billingMode from "@/features/wallet/server/billing-mode";
// Global Traffic Metering
import { trafficMeteringMiddleware } from "@/lib/traffic-metering-middleware";

// Apply global traffic metering to ALL requests
// WHY: Every HTTP request MUST generate a usage event for billing
const app = new Hono()
  .use("*", trafficMeteringMiddleware)
  .basePath("/api");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .route("/auth", auth)
  .route("/workspaces", workspaces)
  .route("/members", members)
  .route("/projects", projects)
  .route("/tasks", tasks)
  .route("/timeLogs", timeLogs)
  .route("/custom-columns", customColumns)
  .route("/default-column-settings", defaultColumnSettings)
  .route("/attachments", attachments)
  .route("/notifications", notifications)
  .route("/sprints", sprints)
  .route("/work-items", workItems)
  .route("/personal-backlog", personalBacklog)
  .route("/github", githubIntegration)
  .route("/audit-logs", auditLogs)
  .route("/subtasks", subtasks)
  .route("/teams", teams)
  .route("/programs", programs)
  .route("/comments", comments)
  .route("/project-docs", projectDocs)
  // New Jira-like features
  .route("/spaces", spaces)
  .route("/workflows", workflows)
  .route("/workflow-ai", workflowAI)
  .route("/custom-fields", customFields)
  .route("/work-item-links", workItemLinks)
  .route("/saved-views", savedViews)
  .route("/roles", roles)
  // Project-scoped RBAC
  .route("/project-members", projectMembers)
  // Usage-Based Billing
  .route("/usage", usage)
  // Organizations & Account Management
  .route("/organizations", organizations)
  // Departments (org-level grouping)
  .route("/departments", departments)
  // Org Permissions (explicit per-user)
  .route("/org-permissions", orgPermissions)
  // Billing & Payment
  .route("/billing", billing)
  .route("/webhooks", webhooks)
  // Currency Conversion (for admin panel)
  .route("/currency", currency)
  // Scheduled Jobs (protected by CRON_SECRET)
  .route("/cron", cron)
  // User Access (permission-driven navigation)
  .route("/user-access", userAccess)
  // Wallet & Prepaid Billing
  .route("/wallet", wallet)
  .route("/billing-mode", billingMode);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;

