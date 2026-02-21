export default function Loading() {
    return (
        <div className="flex flex-col gap-y-4 animate-pulse">
            {/* Backlog header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-32 bg-muted rounded" />
                    <div className="h-4 w-48 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 bg-muted rounded" />
                    <div className="h-9 w-9 bg-muted rounded" />
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex gap-2 mt-2">
                <div className="h-9 w-64 bg-muted rounded" />
                <div className="h-9 w-28 bg-muted rounded" />
                <div className="h-9 w-28 bg-muted rounded" />
            </div>

            {/* Work items list */}
            <div className="space-y-2 mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        <div className="h-5 w-5 bg-muted rounded" />
                        <div className="h-4 w-16 bg-muted rounded" />
                        <div className="flex-1 h-4 bg-muted rounded" />
                        <div className="h-6 w-6 bg-muted rounded-full" />
                        <div className="h-5 w-16 bg-muted rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
