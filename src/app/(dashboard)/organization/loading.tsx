export default function Loading() {
    return (
        <div className="flex flex-col gap-y-4 animate-pulse">
            {/* Org header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-muted rounded-full" />
                    <div className="space-y-2">
                        <div className="h-6 w-40 bg-muted rounded" />
                        <div className="h-3 w-56 bg-muted rounded" />
                    </div>
                </div>
                <div className="h-9 w-28 bg-muted rounded" />
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 border-b border-border pb-2 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-muted rounded" />
                ))}
            </div>

            {/* Settings content */}
            <div className="space-y-4 mt-2">
                <div className="border border-border rounded-lg p-6 space-y-4">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-9 w-full bg-muted rounded" />
                    <div className="h-9 w-full bg-muted rounded" />
                </div>
                <div className="border border-border rounded-lg p-6 space-y-4">
                    <div className="h-5 w-48 bg-muted rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 bg-muted rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
