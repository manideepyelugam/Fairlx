"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    FileText,
    User,
    Building2,
    UserPlus,
    UserMinus,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    Filter,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useGetOrgAuditLogs } from "../api/use-get-org-audit-logs";
import { OrgAuditAction } from "../audit";

interface AuditLogEntry {
    $id: string;
    organizationId: string;
    actorUserId: string;
    actionType: string;
    metadata: string | Record<string, unknown>;
    timestamp: string;
}

interface OrganizationAuditLogsProps {
    organizationId: string;
}

/**
 * Organization Audit Logs View
 * 
 * Read-only display of organization audit events.
 * Visible only to OWNER for compliance and debugging.
 * 
 * INVARIANTS:
 * - No editing, deleting, or exporting (read-only)
 * - Pagination for large datasets
 * - Filter by action type
 */
export function OrganizationAuditLogs({ organizationId }: OrganizationAuditLogsProps) {
    const [offset, setOffset] = useState(0);
    const [actionFilter, setActionFilter] = useState<string>("all");
    const limit = 20;

    const { data, isLoading, isError, refetch, isRefetching } = useGetOrgAuditLogs({
        organizationId,
        limit,
        offset,
        actionType: actionFilter === "all" ? undefined : actionFilter,
    });

    const logs = (data?.data || []) as AuditLogEntry[];
    const total = data?.total || 0;
    const hasNext = offset + limit < total;
    const hasPrev = offset > 0;

    const handleNext = () => setOffset((o) => o + limit);
    const handlePrev = () => setOffset((o) => Math.max(0, o - limit));

    const getActionIcon = (action: string) => {
        switch (action) {
            case OrgAuditAction.ORGANIZATION_CREATED:
            case OrgAuditAction.ORGANIZATION_DELETED:
            case OrgAuditAction.ORGANIZATION_RESTORED:
                return <Building2 className="h-4 w-4" />;
            case OrgAuditAction.ACCOUNT_CONVERTED:
                return <RefreshCcw className="h-4 w-4" />;
            case OrgAuditAction.MEMBER_ADDED:
                return <UserPlus className="h-4 w-4" />;
            case OrgAuditAction.MEMBER_REMOVED:
                return <UserMinus className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
        if (action.includes("deleted") || action.includes("removed")) return "destructive";
        if (action.includes("created") || action.includes("added")) return "default";
        return "secondary";
    };

    const formatAction = (action: string) => {
        return action
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatMetadata = (metadata: string | Record<string, unknown>) => {
        try {
            const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
            const entries = Object.entries(parsed).slice(0, 3);
            return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
        } catch {
            return "-";
        }
    };

    const safeFormatDate = (timestamp: string | undefined | null, formatStr: string) => {
        try {
            if (!timestamp) return "-";
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return "-";
            return format(date, formatStr);
        } catch {
            return "-";
        }
    };

    if (isError) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Failed to load audit logs</p>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Audit Logs
                        </CardTitle>
                        <CardDescription>
                            Read-only view of organization activity for compliance
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setOffset(0); }}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <Filter className="h-3 w-3 mr-1" />
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value={OrgAuditAction.ORGANIZATION_CREATED}>Created</SelectItem>
                                <SelectItem value={OrgAuditAction.ACCOUNT_CONVERTED}>Converted</SelectItem>
                                <SelectItem value={OrgAuditAction.MEMBER_ADDED}>Member Added</SelectItem>
                                <SelectItem value={OrgAuditAction.MEMBER_REMOVED}>Member Removed</SelectItem>
                                <SelectItem value={OrgAuditAction.MEMBER_ROLE_CHANGED}>Role Changed</SelectItem>
                                <SelectItem value={OrgAuditAction.ORGANIZATION_DELETED}>Deleted</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                            <RefreshCcw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No audit logs found</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {logs.map((log) => (
                                <div
                                    key={log.$id}
                                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                                        {getActionIcon(log.actionType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={getActionBadgeVariant(log.actionType)} className="text-xs">
                                                {formatAction(log.actionType)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {log.actorUserId.slice(0, 8)}...
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {formatMetadata(log.metadata)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                            {safeFormatDate(log.timestamp, "MMM d, yyyy")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {safeFormatDate(log.timestamp, "h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrev}
                                    disabled={!hasPrev}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={!hasNext}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
