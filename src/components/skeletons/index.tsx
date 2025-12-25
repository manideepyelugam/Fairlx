"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Screen-Level Skeleton Loaders
 * 
 * Rules:
 * - Use skeleton loaders for content-heavy pages
 * - NEVER show "No data" until loading completes
 * - No layout shifting when content loads
 */

// =================================
// Dashboard Skeleton (cards/widgets)
// =================================

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-9 w-32" />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                ))}
            </div>

            {/* Chart Area */}
            <div className="rounded-lg border p-4">
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-48 w-full" />
            </div>

            {/* Recent Items */}
            <div className="rounded-lg border p-4 space-y-4">
                <Skeleton className="h-5 w-40" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// =================================
// Table Skeleton (rows with cells)
// =================================

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 4 }: TableSkeletonProps) => {
    return (
        <div className="rounded-lg border">
            {/* Header */}
            <div className="border-b p-4">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="border-b last:border-0 p-4">
                    <div className="flex gap-4 items-center">
                        {Array.from({ length: columns }).map((_, colIdx) => (
                            <Skeleton
                                key={colIdx}
                                className={`h-4 flex-1 ${colIdx === 0 ? 'max-w-[200px]' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// =================================
// List Skeleton (vertical items)
// =================================

interface ListSkeletonProps {
    items?: number;
    showAvatar?: boolean;
}

export const ListSkeleton = ({ items = 5, showAvatar = true }: ListSkeletonProps) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    );
};

// =================================
// Kanban Board Skeleton
// =================================

interface KanbanSkeletonProps {
    columns?: number;
    cardsPerColumn?: number;
}

export const KanbanSkeleton = ({ columns = 4, cardsPerColumn = 3 }: KanbanSkeletonProps) => {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
                <div key={colIdx} className="flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 space-y-3">
                    {/* Column Header */}
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-6 w-6 rounded" />
                    </div>
                    {/* Cards */}
                    {Array.from({ length: cardsPerColumn }).map((_, cardIdx) => (
                        <div key={cardIdx} className="bg-background rounded-lg p-3 space-y-2 border">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                            <div className="flex items-center gap-2 pt-2">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

// =================================
// Page Header Skeleton
// =================================

export const PageHeaderSkeleton = () => {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
            </div>
        </div>
    );
};

// =================================
// Members Row Skeleton
// =================================

interface MembersSkeletonProps {
    rows?: number;
}

export const MembersSkeleton = ({ rows = 5 }: MembersSkeletonProps) => {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// =================================
// Section Skeleton (for billing, settings)
// =================================

export const SectionSkeleton = () => {
    return (
        <div className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
    );
};

// =================================
// Infinite Loader (for audit logs)
// =================================

export const InfiniteLoadingSkeleton = () => {
    return (
        <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-flex h-5 w-5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
                <span className="text-sm">Loading more…</span>
            </div>
        </div>
    );
};
