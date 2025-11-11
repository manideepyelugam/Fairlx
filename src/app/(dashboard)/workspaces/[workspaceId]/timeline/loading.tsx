import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for the timeline page
 * Shows skeleton UI while data is being fetched
 */
export default function TimelineLoading() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-80 border-r bg-background p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <div className="ml-4 space-y-1">
                <Skeleton className="h-6 w-[90%]" />
                <Skeleton className="h-6 w-[85%]" />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Grid Skeleton */}
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
