import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const DashboardStatsSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 pl-5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted" />
                    <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-6 rounded-lg" />
                    </div>
                    <div className="flex items-end justify-between">
                        <Skeleton className="h-10 w-12" />
                        <div className="flex gap-0.5 h-8">
                            {Array.from({ length: 12 }).map((_, j) => (
                                <Skeleton key={j} className="w-1 rounded-sm" style={{ height: `${20 + (j * 7) % 40 + 20}%` }} />
                            ))}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export const DashboardChartsSkeleton = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
                <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="h-[240px] flex items-end gap-2 px-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${30 + (i * 15) % 60 + 10}%` }} />
                    ))}
                </div>
            </Card>
            <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const DashboardTasksSkeleton = () => {
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-border">
                <div className="col-span-4"><Skeleton className="h-3 w-12" /></div>
                <div className="col-span-2"><Skeleton className="h-3 w-12" /></div>
                <div className="col-span-2"><Skeleton className="h-3 w-12" /></div>
                <div className="col-span-2"><Skeleton className="h-3 w-12" /></div>
                <div className="col-span-2"><Skeleton className="h-3 w-12" /></div>
            </div>
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 py-3 items-center">
                        <div className="col-span-4 flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                        <div className="col-span-2"><Skeleton className="h-4 w-20" /></div>
                        <div className="col-span-2"><Skeleton className="h-4 w-16" /></div>
                        <div className="col-span-2"><Skeleton className="h-6 w-16 rounded-full" /></div>
                        <div className="col-span-2"><Skeleton className="h-5 w-16 rounded" /></div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export const DashboardSidebarSkeleton = () => {
    return (
        <div className="flex flex-col space-y-4 h-full">
            <Card className="p-5 flex-1">
                <Skeleton className="h-5 w-24 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div className="space-y-1 flex-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <Card className="p-5 flex-1">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div className="space-y-1 flex-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
