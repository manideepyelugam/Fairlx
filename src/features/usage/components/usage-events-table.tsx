"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Activity,
    HardDrive,
    Cpu,
    Download,
    ChevronLeft,
    ChevronRight,
    Filter,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageEvent, ResourceType, UsageSource } from "../types";

interface UsageEventsTableProps {
    events: UsageEvent[];
    total: number;
    isLoading: boolean;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onExport: (format: "csv" | "json") => void;
    resourceTypeFilter?: ResourceType;
    sourceFilter?: UsageSource;
    onResourceTypeFilterChange: (type: ResourceType | undefined) => void;
    onSourceFilterChange: (source: UsageSource | undefined) => void;
}

const getResourceIcon = (type: ResourceType) => {
    switch (type) {
        case ResourceType.TRAFFIC:
            return <Activity className="h-4 w-4 text-blue-500" />;
        case ResourceType.STORAGE:
            return <HardDrive className="h-4 w-4 text-amber-500" />;
        case ResourceType.COMPUTE:
            return <Cpu className="h-4 w-4 text-purple-500" />;
    }
};

const getSourceBadgeVariant = (source: UsageSource) => {
    switch (source) {
        case UsageSource.API:
            return "default";
        case UsageSource.FILE:
            return "secondary";
        case UsageSource.JOB:
            return "outline";
        case UsageSource.AI:
            return "destructive";
        default:
            return "default";
    }
};

const formatUnits = (units: number, type: ResourceType) => {
    if (type === ResourceType.COMPUTE) {
        return `${units.toLocaleString()} units`;
    }
    // Convert bytes
    if (units >= 1024 * 1024 * 1024) {
        return `${(units / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (units >= 1024 * 1024) {
        return `${(units / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (units >= 1024) {
        return `${(units / 1024).toFixed(2)} KB`;
    }
    return `${units} B`;
};

export function UsageEventsTable({
    events,
    total,
    isLoading,
    page,
    pageSize,
    onPageChange,
    onExport,
    resourceTypeFilter,
    sourceFilter,
    onResourceTypeFilterChange,
    onSourceFilterChange,
}: UsageEventsTableProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const totalPages = Math.ceil(total / pageSize);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                        ))}
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
                        <CardTitle>Usage Events</CardTitle>
                        <CardDescription>
                            {total.toLocaleString()} total events
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Filters */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                    {(resourceTypeFilter || sourceFilter) && (
                                        <Badge variant="secondary" className="ml-2">
                                            {[resourceTypeFilter, sourceFilter].filter(Boolean).length}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Resource Type</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={!resourceTypeFilter}
                                    onCheckedChange={() => onResourceTypeFilterChange(undefined)}
                                >
                                    All Types
                                </DropdownMenuCheckboxItem>
                                {Object.values(ResourceType).map((type) => (
                                    <DropdownMenuCheckboxItem
                                        key={type}
                                        checked={resourceTypeFilter === type}
                                        onCheckedChange={() =>
                                            onResourceTypeFilterChange(
                                                resourceTypeFilter === type ? undefined : type
                                            )
                                        }
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Source</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={!sourceFilter}
                                    onCheckedChange={() => onSourceFilterChange(undefined)}
                                >
                                    All Sources
                                </DropdownMenuCheckboxItem>
                                {Object.values(UsageSource).map((source) => (
                                    <DropdownMenuCheckboxItem
                                        key={source}
                                        checked={sourceFilter === source}
                                        onCheckedChange={() =>
                                            onSourceFilterChange(
                                                sourceFilter === source ? undefined : source
                                            )
                                        }
                                    >
                                        {source.toUpperCase()}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Export */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuCheckboxItem onCheckedChange={() => onExport("csv")}>
                                    Export as CSV
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem onCheckedChange={() => onExport("json")}>
                                    Export as JSON
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Units</TableHead>
                                <TableHead>Context</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No usage events found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow
                                        key={event.$id}
                                        className="cursor-pointer"
                                        onClick={() =>
                                            setExpandedRow(expandedRow === event.$id ? null : event.$id)
                                        }
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getResourceIcon(event.resourceType)}
                                                <span className="capitalize">{event.resourceType}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getSourceBadgeVariant(event.source)}>
                                                {event.source.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {formatUnits(event.units, event.resourceType)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {(() => {
                                                try {
                                                    const meta = event.metadata ? JSON.parse(event.metadata) : null;
                                                    const ctx = meta?.sourceContext;
                                                    if (ctx?.displayName) return ctx.displayName;
                                                    if (ctx?.type === 'admin') return 'Admin Panel';
                                                    if (ctx?.type === 'project') return ctx.projectName || 'Project';
                                                    if (ctx?.type === 'workspace') return ctx.workspaceName || 'Workspace';
                                                    return ctx?.type || 'Unknown';
                                                } catch {
                                                    return 'Unknown';
                                                }
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(event.timestamp), "MMM d, yyyy HH:mm")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 0}
                                onClick={() => onPageChange(page - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => onPageChange(page + 1)}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
