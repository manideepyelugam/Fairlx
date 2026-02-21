export default function Loading() {
    return (
        <div className="flex flex-col gap-y-4 animate-pulse">
            {/* Members header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-32 bg-muted rounded" />
                    <div className="h-4 w-48 bg-muted rounded" />
                </div>
                <div className="h-9 w-32 bg-muted rounded" />
            </div>

            {/* Search bar */}
            <div className="h-9 w-72 bg-muted rounded mt-2" />

            {/* Members grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border border-border rounded-lg">
                        <div className="h-10 w-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                        <div className="h-6 w-16 bg-muted rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
