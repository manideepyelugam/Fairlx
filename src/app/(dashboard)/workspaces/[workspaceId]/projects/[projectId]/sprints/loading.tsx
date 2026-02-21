export default function Loading() {
    return (
        <div className="flex flex-col gap-y-4 animate-pulse">
            {/* Sprint header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-36 bg-muted rounded" />
                    <div className="h-4 w-52 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-28 bg-muted rounded" />
                    <div className="h-9 w-9 bg-muted rounded" />
                </div>
            </div>

            {/* View switcher */}
            <div className="flex gap-2 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 bg-muted rounded" />
                ))}
            </div>

            {/* Board columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {Array.from({ length: 4 }).map((_, col) => (
                    <div key={col} className="space-y-3">
                        <div className="h-8 bg-muted rounded" />
                        {Array.from({ length: 3 }).map((_, card) => (
                            <div key={card} className="h-24 bg-muted rounded-lg" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
