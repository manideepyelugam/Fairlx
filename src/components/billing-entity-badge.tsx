"use client";

import { Building2, User, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccountType } from "@/features/organizations/hooks/use-account-type";
import { useGetOrganizations } from "@/features/organizations/api/use-get-organizations";

interface BillingEntityBadgeProps {
    showTooltip?: boolean;
    variant?: "default" | "outline" | "secondary";
    className?: string;
}

export function BillingEntityBadge({
    showTooltip = true,
    variant = "default",
    className
}: BillingEntityBadgeProps) {
    const { isOrg, primaryOrganizationId } = useAccountType();
    const { data: organizations } = useGetOrganizations();

    // Get current org name
    const currentOrg = isOrg && primaryOrganizationId
        ? organizations?.documents?.find((o: { $id: string }) => o.$id === primaryOrganizationId)
        : null;

    const orgName = (currentOrg as { name?: string })?.name || "Organization";

    const badge = (
        <Badge
            variant={isOrg ? variant : "secondary"}
            className={className}
        >
            {isOrg ? (
                <>
                    <Building2 className="h-3 w-3 mr-1" />
                    {orgName}
                </>
            ) : (
                <>
                    <User className="h-3 w-3 mr-1" />
                    Personal
                </>
            )}
        </Badge>
    );

    if (!showTooltip) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                        {badge}
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">
                        {isOrg
                            ? `All workspaces in "${orgName}" share organization-level billing. Usage is aggregated across all workspaces.`
                            : "This is a personal account. Only this workspace is billed to your user account."}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
