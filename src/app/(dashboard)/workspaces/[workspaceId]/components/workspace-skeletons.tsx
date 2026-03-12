import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="relative overflow-hidden border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-20 mt-2" />
            <Skeleton className="h-3 w-32 mt-2" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const DashboardChartsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Status Overview skeleton */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
            <div className="flex gap-4 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Priority Distribution skeleton */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-end gap-4 px-6">
            {[40, 60, 90, 50].map((h, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t-md"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex gap-4 justify-center mt-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DashboardTasksSkeleton = () => {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-3 pb-2 border-b border-border/50">
          <div className="col-span-5">
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-3 py-3 items-center"
            >
              <div className="col-span-5 flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="col-span-1">
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardBottomSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
