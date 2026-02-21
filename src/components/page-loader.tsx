/**
 * Universal page loading skeleton.
 * Replaces the old spinner with a content-aware skeleton layout
 * that provides instant perceived performance during data fetches.
 */
export const PageLoader = () => {
  return (
    <div className="flex flex-col gap-y-6 p-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <div className="h-7 w-48 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted/60 rounded-md" />
        </div>
        <div className="flex items-center gap-x-2">
          <div className="h-8 w-24 bg-muted rounded-md" />
          <div className="h-8 w-24 bg-muted rounded-md" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="h-3 w-20 bg-muted/60 rounded mb-3" />
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center gap-x-2">
        <div className="h-8 w-48 bg-muted/50 rounded-md" />
        <div className="h-8 w-24 bg-muted/50 rounded-md" />
        <div className="h-8 w-24 bg-muted/50 rounded-md" />
        <div className="ml-auto h-8 w-32 bg-muted/50 rounded-md" />
      </div>

      {/* Content rows skeleton */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-x-4 rounded-lg border border-border bg-card p-4">
            <div className="h-4 w-4 bg-muted/60 rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 flex-1 bg-muted/50 rounded" />
            <div className="h-6 w-20 bg-muted/60 rounded-full" />
            <div className="h-6 w-6 bg-muted/40 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
