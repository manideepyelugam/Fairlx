import { formatDistanceToNow } from "date-fns";
import { 
  Activity,
  FileText, 
  FolderKanban, 
  Users, 
  Clock,
  Paperclip,
  LayoutGrid,
  ListTodo,
  Briefcase,
  Zap
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { ActivityType } from "../types";

interface ActivityLogItemProps {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  timestamp: string;
  userName?: string;
  userEmail?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

type IconComponent = React.ComponentType<{ className?: string }>;

const getActivityIcon = (type: ActivityType): IconComponent => {
  const iconMap: Record<ActivityType, IconComponent> = {
    [ActivityType.TASK]: FileText,
    [ActivityType.PROJECT]: FolderKanban,
    [ActivityType.WORKSPACE]: Briefcase,
    [ActivityType.MEMBER]: Users,
    [ActivityType.SPRINT]: Zap,
    [ActivityType.WORK_ITEM]: ListTodo,
    [ActivityType.TIME_LOG]: Clock,
    [ActivityType.ATTACHMENT]: Paperclip,
    [ActivityType.CUSTOM_COLUMN]: LayoutGrid,
    [ActivityType.BACKLOG_ITEM]: ListTodo,
    [ActivityType.NOTIFICATION]: Activity,
  };

  return iconMap[type] || Activity;
};

const getActivityColor = (action: string) => {
  switch (action) {
    case "created":
      return "bg-green-100 text-green-700 border-green-300";
    case "updated":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "deleted":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

export const ActivityLogItem = ({
  type,
  action,
  timestamp,
  userName,
  userEmail,
  entityName,
  metadata,
}: ActivityLogItemProps) => {
  const Icon = getActivityIcon(type);
  const colorClass = getActivityColor(action);
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "??";

  return (
    <div className="flex items-start gap-3 p-4 hover:bg-muted/50 rounded-lg transition-colors border-b border-border/40 last:border-0">
      <Avatar className="h-9 w-9 mt-0.5 border-2 border-background shadow-sm">
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {userName || "Unknown User"}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${colorClass} border font-medium`}
            >
              {action}
            </Badge>
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground capitalize">
              {type}
            </span>
          </div>
          
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-foreground font-medium">
            &quot;{entityName}&quot;
          </span>
          
          {(metadata?.status && typeof metadata.status === 'string') ? (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Status:</span>
              <Badge variant="secondary" className="text-xs font-medium">
                {String(metadata.status)}
              </Badge>
            </>
          ) : null}
          
          {(metadata?.priority && typeof metadata.priority === 'string') ? (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Priority:</span>
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium ${
                  metadata.priority === 'HIGH' || metadata.priority === 'URGENT' 
                    ? 'bg-red-100 text-red-700' 
                    : metadata.priority === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {String(metadata.priority)}
              </Badge>
            </>
          ) : null}
        </div>
        
        {userEmail && (
          <div className="text-xs text-muted-foreground">
            {userEmail}
          </div>
        )}
      </div>
    </div>
  );
};

interface ActivityLogListProps {
  activities: ActivityLogItemProps[];
  isLoading?: boolean;
}

export const ActivityLogList = ({ activities, isLoading }: ActivityLogListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No activities found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-1">
        {activities.map((activity) => (
          <ActivityLogItem key={activity.id} {...activity} />
        ))}
      </div>
    </ScrollArea>
  );
};

interface ActivityLogCardProps {
  workspaceId: string;
  activities: ActivityLogItemProps[];
  isLoading?: boolean;
  title?: string;
}

export const ActivityLogCard = ({
  activities,
  isLoading,
  title = "Recent Activity",
}: ActivityLogCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityLogList activities={activities} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
};
