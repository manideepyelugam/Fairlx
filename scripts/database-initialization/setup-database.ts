import { databases } from './lib/appwrite-client';
import { ensureDatabase } from './lib/db-helpers';
import { logger, printSummary } from './lib/logger';

// ─── Collection Setup Imports ────────────────────────────────
import { setupWorkspaces } from './collections/workspaces';
import { setupMembers } from './collections/members';
import { setupProjects } from './collections/projects';
import { setupProjectMembers } from './collections/project-members';
import { setupProjectRoles } from './collections/project-roles';
import { setupWorkItems } from './collections/work-items';
import { setupSprints } from './collections/sprints';
import { setupPersonalBacklog } from './collections/personal-backlog';
import { setupCustomColumns } from './collections/custom-columns';
import { setupDefaultColumnSettings } from './collections/default-column-settings';
import { setupNotifications } from './collections/notifications';
import { setupAttachments } from './collections/attachments';
import { setupComments } from './collections/comments';
import { setupProjectDocs } from './collections/project-docs';
import { setupAuditLogs } from './collections/audit-logs';
import { setupOrganizationAuditLogs } from './collections/organization-audit-logs';
import { setupOrganizations } from './collections/organizations';
import { setupOrganizationMembers } from './collections/organization-members';
import { setupDepartments } from './collections/departments';
import { setupOrgMemberDepartments } from './collections/org-member-departments';
import { setupOrgMemberPermissions } from './collections/org-member-permissions';
import { setupDepartmentPermissions } from './collections/department-permissions';
import { setupLoginTokens } from './collections/login-tokens';
import { setupVerificationTokens } from './collections/verification-tokens';
import { setupUsageEvents } from './collections/usage-events';
import { setupUsageAggregations } from './collections/usage-aggregations';
import { setupUsageAlerts } from './collections/usage-alerts';
import { setupUsageDeductions } from './collections/usage-deductions';
import { setupBillingAccounts } from './collections/billing-accounts';
import { setupBillingAuditLogs } from './collections/billing-audit-logs';
import { setupBillingSettings } from './collections/billing-settings';
import { setupStorageDailySnapshots } from './collections/storage-daily-snapshots';
import { setupInvoices } from './collections/invoices';
import { setupProcessedEvents } from './collections/processed-events';
import { setupWallets } from './collections/wallets';
import { setupWalletTransactions } from './collections/wallet-transactions';
import { setupGithubRepositories } from './collections/github-repositories';
import { setupCodeDocumentation } from './collections/code-documentation';
import { setupProjectTeams } from './collections/project-teams';
import { setupProjectTeamMembers } from './collections/project-team-members';
import { setupProjectPermissions } from './collections/project-permissions';
import { setupPrograms } from './collections/programs';
import { setupCustomRoles } from './collections/custom-roles';
import { setupSpaces } from './collections/spaces';
import { setupSpaceMembers } from './collections/space-members';
import { setupWorkflows } from './collections/workflows';
import { setupWorkflowStatuses } from './collections/workflow-statuses';
import { setupWorkflowTransitions } from './collections/workflow-transitions';
import { setupCustomFields } from './collections/custom-fields';
import { setupCustomWorkItemTypes } from './collections/custom-work-item-types';
import { setupWorkItemLinks } from './collections/work-item-links';
import { setupSavedViews } from './collections/saved-views';
import { setupSubtasks } from './collections/subtasks';
import { setupTimeLogs } from './collections/time-logs';
import { setupProjectWebhooks } from './collections/project-webhooks';
import { setupProjectWebhookDeliveries } from './collections/project-webhook-deliveries';
import { setupUserRecoveryCodes } from './collections/user-recovery-codes';
import { setupEmailOtpCodes } from './collections/email-otp-codes';

// ─── Configuration ───────────────────────────────────────────
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? 'fairlx';
const DATABASE_NAME = 'Fairlx';

// ─── Collection Setup Functions (ordered) ────────────────────
const collectionSetups: Array<{
    name: string;
    setup: (databases: typeof import('./lib/appwrite-client').databases, databaseId: string) => Promise<void>;
}> = [
        // Core
        { name: 'Workspaces', setup: setupWorkspaces },
        { name: 'Members', setup: setupMembers },
        { name: 'Projects', setup: setupProjects },
        { name: 'Project Members', setup: setupProjectMembers },
        { name: 'Project Roles', setup: setupProjectRoles },

        // Work Management
        { name: 'Work Items', setup: setupWorkItems },
        { name: 'Sprints', setup: setupSprints },
        { name: 'Personal Backlog', setup: setupPersonalBacklog },
        { name: 'Custom Columns', setup: setupCustomColumns },
        { name: 'Default Column Settings', setup: setupDefaultColumnSettings },

        // Collaboration
        { name: 'Notifications', setup: setupNotifications },
        { name: 'Attachments', setup: setupAttachments },
        { name: 'Comments', setup: setupComments },
        { name: 'Project Docs', setup: setupProjectDocs },

        // Audit
        { name: 'Audit Logs', setup: setupAuditLogs },
        { name: 'Organization Audit Logs', setup: setupOrganizationAuditLogs },

        // Organization
        { name: 'Organizations', setup: setupOrganizations },
        { name: 'Organization Members', setup: setupOrganizationMembers },
        { name: 'Departments', setup: setupDepartments },
        { name: 'Org Member Departments', setup: setupOrgMemberDepartments },
        { name: 'Org Member Permissions', setup: setupOrgMemberPermissions },
        { name: 'Department Permissions', setup: setupDepartmentPermissions },

        // Auth
        { name: 'Login Tokens', setup: setupLoginTokens },
        { name: 'Verification Tokens', setup: setupVerificationTokens },

        // Usage & Billing
        { name: 'Usage Events', setup: setupUsageEvents },
        { name: 'Usage Aggregations', setup: setupUsageAggregations },
        { name: 'Usage Alerts', setup: setupUsageAlerts },
        { name: 'Usage Deductions', setup: setupUsageDeductions },
        { name: 'Billing Accounts', setup: setupBillingAccounts },
        { name: 'Billing Audit Logs', setup: setupBillingAuditLogs },
        { name: 'Billing Settings', setup: setupBillingSettings },
        { name: 'Storage Daily Snapshots', setup: setupStorageDailySnapshots },
        { name: 'Invoices', setup: setupInvoices },
        { name: 'Processed Events', setup: setupProcessedEvents },

        // Wallets
        { name: 'Wallets', setup: setupWallets },
        { name: 'Wallet Transactions', setup: setupWalletTransactions },

        // Integrations
        { name: 'GitHub Repositories', setup: setupGithubRepositories },
        { name: 'Code Documentation', setup: setupCodeDocumentation },

        // Teams & Permissions
        { name: 'Project Teams', setup: setupProjectTeams },
        { name: 'Project Team Members', setup: setupProjectTeamMembers },
        { name: 'Project Permissions', setup: setupProjectPermissions },

        // Programs & Roles
        { name: 'Programs', setup: setupPrograms },
        { name: 'Custom Roles', setup: setupCustomRoles },

        // Spaces
        { name: 'Spaces', setup: setupSpaces },
        { name: 'Space Members', setup: setupSpaceMembers },

        // Workflows
        { name: 'Workflows', setup: setupWorkflows },
        { name: 'Workflow Statuses', setup: setupWorkflowStatuses },
        { name: 'Workflow Transitions', setup: setupWorkflowTransitions },

        // Customization
        { name: 'Custom Fields', setup: setupCustomFields },
        { name: 'Custom Work Item Types', setup: setupCustomWorkItemTypes },
        { name: 'Work Item Links', setup: setupWorkItemLinks },
        { name: 'Saved Views', setup: setupSavedViews },
        { name: 'Subtasks', setup: setupSubtasks },
        { name: 'Time Logs', setup: setupTimeLogs },

        // Webhooks
        { name: 'Project Webhooks', setup: setupProjectWebhooks },
        { name: 'Project Webhook Deliveries', setup: setupProjectWebhookDeliveries },

        // Auth (additional)
        { name: 'User Recovery Codes', setup: setupUserRecoveryCodes },
        { name: 'Email OTP Codes', setup: setupEmailOtpCodes },
    ];

// ─── Main ────────────────────────────────────────────────────

async function main() {
    console.log('\n');
    logger.separator();
    console.log('\x1b[1m\x1b[35m🚀 FAIRLX DATABASE SETUP\x1b[0m');
    logger.separator();
    logger.info(`Database ID: ${DATABASE_ID}`);
    logger.info(`Total collections to process: ${collectionSetups.length}`);
    console.log('');

    // Step 1: Ensure database exists
    logger.database(DATABASE_NAME);
    await ensureDatabase(databases, DATABASE_ID, DATABASE_NAME);

    // Step 2: Process all collections sequentially
    for (const { name, setup } of collectionSetups) {
        try {
            await setup(databases, DATABASE_ID);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`\x1b[31m❌ Fatal error in collection "${name}": ${message}\x1b[0m`);
            console.error(`\x1b[33m   Continuing with next collection...\x1b[0m`);
        }
    }

    // Step 3: Print summary
    printSummary();
}

// Execute
main().catch((err) => {
    console.error('\x1b[31m❌ Unhandled error during database setup:\x1b[0m', err);
    process.exit(1);
});
