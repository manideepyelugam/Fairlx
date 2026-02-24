// Mini bar chart component for stat cards - uses semantic colors based on variant
export const MiniBarChart = ({ value, max, variant = "default" }: { value: number; max: number; variant?: "default" | "dotted" | "blocks" }) => {
    const bars = 12
    const filledBars = Math.round((value / Math.max(max, 1)) * bars)

    // dotted variant - used for pending/warning states (amber)
    if (variant === "dotted") {
        return (
            <div className="flex items-end gap-0.5 h-7">
                {Array.from({ length: bars }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 rounded-sm ${i < filledBars ? 'bg-amber-500' : 'bg-amber-500/15'}`}
                        style={{ height: `${20 + (i * 5) % 30 + 20}%` }}
                    />
                ))}
            </div>
        )
    }

    // blocks variant - used for completed/success states (emerald)
    if (variant === "blocks") {
        return (
            <div className="flex items-end gap-1 h-7">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-2.5 h-5 rounded-sm ${i < Math.ceil(filledBars / 2) ? 'bg-emerald-500' : 'bg-emerald-500/15'}`}
                    />
                ))}
            </div>
        )
    }

    // default variant - blue for totals
    return (
        <div className="flex items-end gap-0.5 h-7">
            {Array.from({ length: bars }).map((_, i) => (
                <div
                    key={i}
                    className={`w-1 rounded-sm ${i < filledBars ? 'bg-blue-500' : 'bg-blue-500/15'}`}
                    style={{ height: `${30 + (i * 7) % 40 + 30}%` }}
                />
            ))}
        </div>
    )
}
