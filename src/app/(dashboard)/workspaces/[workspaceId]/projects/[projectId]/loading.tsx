export default function Loading() {
    return (
        <div className="flex flex-col gap-y-4 animate-pulse">
            {/* Project header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-lg" />
                    <div className="space-y-2">
                        <div className="h-6 w-40 bg-muted rounded" />
                        <div className="h-3 w-56 bg-muted rounded" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 bg-muted rounded" />
                    <div className="h-9 w-9 bg-muted rounded" />
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 border-b border-border pb-2 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 bg-muted rounded" />
                ))}
            </div>

            {/* Content area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-lg" />
                ))}
            </div>
        </div>
    );
}
