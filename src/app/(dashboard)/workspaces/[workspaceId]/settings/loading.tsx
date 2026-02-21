export default function Loading() {
    return (
        <div className="flex flex-col gap-y-4 animate-pulse">
            {/* Settings header */}
            <div className="space-y-2">
                <div className="h-7 w-32 bg-muted rounded" />
                <div className="h-4 w-56 bg-muted rounded" />
            </div>

            {/* Settings sections */}
            <div className="space-y-6 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-6 space-y-4">
                        <div className="h-5 w-40 bg-muted rounded" />
                        <div className="space-y-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-9 w-full bg-muted rounded" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-9 w-full bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
