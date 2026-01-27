"use client";

import { Users } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
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
      <Card className="p-5 bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="size-10 rounded-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (error || !membersData) {
    return (
      <Card className="p-5 bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Failed to load team members
        </p>
      </Card>
    );
  }

  const members = membersData.documents || [];
  const displayMembers = members.slice(0, limit);
  const remainingCount = Math.max(0, members.length - limit);

  return (
    <Card className="p-5 bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Members
          <span className="text-xs font-normal text-muted-foreground">
            ({members.length})
          </span>
        </h3>
        <Link href={`/workspaces/${workspaceId}/members`}>
          <Button variant="ghost" size="sm" className="h-7 hover:bg-accent text-xs text-muted-foreground">
            Manage
          </Button>
        </Link>
      </div>
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
                className="size-10 hover:scale-110 transition-transform cursor-pointer border-2 border-border"
                fallbackClassName="text-sm"
                withTooltip={true}
                tooltipText={displayInfo}
              />
            );
          })}
          {remainingCount > 0 && (
            <div className="size-10 rounded-full bg-muted border-2 border-border flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
              +{remainingCount}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
