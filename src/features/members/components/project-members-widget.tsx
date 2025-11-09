"use client";

import { Users } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetMembers } from "@/features/members/api/use-get-members";

interface ProjectMembersWidgetProps {
  workspaceId: string;
  // projectId is for future feature to filter members by project
  projectId?: string;
  limit?: number;
}

export const ProjectMembersWidget = ({
  workspaceId,
  limit = 8,
}: ProjectMembersWidgetProps) => {
  const { data: membersData, isLoading, error } = useGetMembers({ workspaceId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="size-10 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !membersData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load team members
          </p>
        </CardContent>
      </Card>
    );
  }

  const members = membersData.documents || [];
  const displayMembers = members.slice(0, limit);
  const remainingCount = Math.max(0, members.length - limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" />
            Team Members
            <span className="text-sm font-normal text-muted-foreground">
              ({members.length})
            </span>
          </CardTitle>
          <Link href={`/workspaces/${workspaceId}/members`}>
            <Button variant="ghost" size="sm" className="h-8">
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No team members yet
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displayMembers.map((member) => {
              const displayName = member.name?.trim() || member.email || "Unknown";
              const displayInfo = member.email
                ? `${displayName}\n${member.email}`
                : displayName;

              return (
                <MemberAvatar
                  key={member.$id}
                  name={displayName}
                  imageUrl={member.profileImageUrl}
                  className="size-10 hover:scale-110 transition-transform cursor-pointer"
                  fallbackClassName="text-sm"
                  withTooltip={true}
                  tooltipText={displayInfo}
                />
              );
            })}
            {remainingCount > 0 && (
              <div className="size-10 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                +{remainingCount}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
