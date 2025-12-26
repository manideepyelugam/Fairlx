import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { OrganizationSettingsClient } from "@/app/(dashboard)/workspaces/[workspaceId]/organization/client";

/**
 * Dashboard-level Organization Settings Page
 * 
 * This route is accessible at /organization (not workspace-scoped)
 * Allows ORG account owners/admins to manage organization settings
 * even when ZERO workspaces exist.
 * 
 * Organization is the control plane - it should never depend on workspace existence.
 */
export default async function OrganizationPage() {
    const user = await getCurrent();

    if (!user) {
        redirect("/sign-in");
    }

    // Check if this is an ORG account
    const prefs = user.prefs || {};
    if (prefs.accountType !== "ORG") {
        // PERSONAL accounts don't have organization settings
        redirect("/");
    }

    return <OrganizationSettingsClient />;
}
