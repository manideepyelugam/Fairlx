"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Activity, HardDrive, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface WorkspaceUsageData {
    workspaceId: string;
    workspaceName: string;
    trafficGB: number;
    storageGB: number;
    computeUnits: number;
    estimatedCost: number;
    status: "active" | "archived";
}

interface WorkspaceUsageBreakdownProps {
    organizationId: string;
    isLoading?: boolean;
}

export function WorkspaceUsageBreakdown({ organizationId, isLoading }: WorkspaceUsageBreakdownProps) {
    const [sortBy, setSortBy] = useState<keyof WorkspaceUsageData>("estimatedCost");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Mock data - in real implementation, fetch from API
    // This would be an aggregation query: GET /api/usage/workspaces?organizationId={id}&period={period}
    const workspaces: WorkspaceUsageData[] = [
        {
            workspaceId: "ws1",
            workspaceName: "Production",
            trafficGB: 45.2,
            storageGB: 120.5,
            computeUnits: 15000,
            estimatedCost: 89.45,
            status: "active",
        },
        {
            workspaceId: "ws2",
            workspaceName: "Development",
            trafficGB: 12.8,
            storageGB: 45.2,
            computeUnits: 5000,
            estimatedCost: 24.30,
            status: "active",
        },
        {
            workspaceId: "ws3",
            workspaceName: "Staging",
            trafficGB: 8.5,
            storageGB: 30.1,
            computeUnits: 3200,
            estimatedCost: 15.75,
            status: "active",
        },
    ];

    const sortedWorkspaces = [...workspaces].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const multiplier = sortOrder === "asc" ? 1 : -1;
        return (aVal > bVal ? 1 : -1) * multiplier;
    });

    const totals = workspaces.reduce(
        (acc, ws) => ({
            trafficGB: acc.trafficGB + ws.trafficGB,
            storageGB: acc.storageGB + ws.storageGB,
            computeUnits: acc.computeUnits + ws.computeUnits,
            estimatedCost: acc.estimatedCost + ws.estimatedCost,
        }),
        { trafficGB: 0, storageGB: 0, computeUnits: 0, estimatedCost: 0 }
    );

    const handleSort = (column: keyof WorkspaceUsageData) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("desc");
        }
    };

    const formatNumber = (num: number, decimals = 2) => {
        return num.toFixed(decimals);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Workspace Usage Breakdown</CardTitle>
                    <CardDescription>Loading workspace usage data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-muted rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Workspace Usage Breakdown
                </CardTitle>
                <CardDescription>
                    Usage and costs by workspace for the current billing period
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Workspace</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort("trafficGB")}
                                >
                                    <div className="flex items-center gap-1">
                                        <Activity className="h-3 w-3" />
                                        Traffic
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort("storageGB")}
                                >
                                    <div className="flex items-center gap-1">
                                        <HardDrive className="h-3 w-3" />
                                        Storage
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort("computeUnits")}
                                >
                                    <div className="flex items-center gap-1">
                                        <Cpu className="h-3 w-3" />
                                        Compute
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50 text-right"
                                    onClick={() => handleSort("estimatedCost")}
                                >
                                    Est. Cost
                                </TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedWorkspaces.map((workspace) => (
                                <TableRow key={workspace.workspaceId}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {workspace.workspaceName}
                                            <Badge variant={workspace.status === "active" ? "default" : "secondary"} className="text-xs">
                                                {workspace.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatNumber(workspace.trafficGB)} GB</TableCell>
                                    <TableCell>{formatNumber(workspace.storageGB)} GB</TableCell>
                                    <TableCell>{workspace.computeUnits.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${formatNumber(workspace.estimatedCost)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={`/workspaces/${workspace.workspaceId}/admin/usage`}>
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                View
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Totals Row */}
                            <TableRow className="bg-muted/50 font-semibold">
                                <TableCell className="font-bold">Total</TableCell>
                                <TableCell>{formatNumber(totals.trafficGB)} GB</TableCell>
                                <TableCell>{formatNumber(totals.storageGB)} GB</TableCell>
                                <TableCell>{totals.computeUnits.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-bold">
                                    ${formatNumber(totals.estimatedCost)}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                    Click column headers to sort. All usage is billed to the organization.
                </p>
            </CardContent>
        </Card>
    );
}
