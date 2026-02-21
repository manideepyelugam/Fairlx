export default function Loading() {
    return (
        <div className="flex flex-col gap-y-4 animate-pulse">
            {/* Usage header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-44 bg-muted rounded" />
                    <div className="h-4 w-64 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-32 bg-muted rounded" />
                    <div className="h-9 w-24 bg-muted rounded" />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 bg-muted rounded-lg" />
                ))}
            </div>

            {/* Chart */}
            <div className="h-72 bg-muted rounded-lg mt-2" />

            {/* Events table */}
            <div className="border border-border rounded-lg mt-2">
                <div className="h-10 bg-muted rounded-t-lg" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border-t border-border">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="flex-1 h-4 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded" />
                        <div className="h-4 w-16 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
