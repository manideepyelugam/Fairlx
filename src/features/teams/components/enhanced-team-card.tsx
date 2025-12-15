"use client";

import { 
  Users, 
  Crown, 
  ChevronRight, 
  MoreVertical, 
  Settings, 
  Trash2, 
  FolderKanban,
  Shield,
  Layers,
  Sparkles,
  X
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Team, TeamVisibility, TeamMemberRole } from "../types";
import { useGetTeamMembers } from "../api/use-get-team-members";
import { useGetTeamProjects } from "../api/use-get-team-projects";
import { Space, SpaceRole } from "@/features/spaces/types";

interface TeamMemberInfo {
  $id: string;
  memberId: string;
  role: TeamMemberRole;
  customRoleId?: string;
  user?: {
    $id: string;
    name: string;
    email?: string;
    profileImageUrl?: string | null;
  };
}

interface EnhancedTeamCardProps {
  team: Team;
  space?: Space | null;
  userSpaceRole?: SpaceRole | null;
  isWorkspaceAdmin?: boolean;
  onTeamClick?: (teamId: string) => void;
  onEditTeam?: (teamId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
  onRemoveFromSpace?: (teamId: string, e: React.MouseEvent) => void;
  showSpaceLabel?: boolean;
  compact?: boolean;
}

const getVisibilityConfig = (visibility: TeamVisibility) => {
  switch (visibility) {
    case TeamVisibility.ALL:
      return { 
        icon: Users, 
        label: "All Members", 
        color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
        description: "Visible to all workspace members"
      };
    case TeamVisibility.PROGRAM_ONLY:
      return { 
        icon: Layers, 
        label: "Program Only", 
        color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
        description: "Only visible to program members"
      };
    case TeamVisibility.TEAM_ONLY:
      return { 
        icon: Shield, 
        label: "Team Only", 
        color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        description: "Only visible to team members"
      };
    default:
      return { 
        icon: Shield, 
        label: visibility, 
        color: "bg-slate-500/10 text-slate-700 border-slate-500/20",
        description: "Unknown visibility"
      };
  }
};

export const EnhancedTeamCard = ({
  team,
  space,
  userSpaceRole,
  isWorkspaceAdmin = false,
  onTeamClick,
  onEditTeam,
  onDeleteTeam,
  onRemoveFromSpace,
  showSpaceLabel = true,
  compact = false,
}: EnhancedTeamCardProps) => {
  const { data: membersData, isLoading: isLoadingMembers } = useGetTeamMembers({ teamId: team.$id });
  const { data: projectsData, isLoading: isLoadingProjects } = useGetTeamProjects({ teamId: team.$id });

  const members = (membersData?.documents || []) as TeamMemberInfo[];
  const projects = (projectsData?.documents || []) as { $id: string; name: string; imageUrl?: string }[];

  const visibilityConfig = getVisibilityConfig(team.visibility);
  const VisibilityIcon = visibilityConfig.icon;

  // Sort members - Team Lead first
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === TeamMemberRole.LEAD) return -1;
    if (b.role === TeamMemberRole.LEAD) return 1;
    return 0;
  });

  const displayMembers = sortedMembers.slice(0, 4);
  const remainingCount = members.length - displayMembers.length;

  // Check if user can manage this team
  const isMaster = userSpaceRole === SpaceRole.ADMIN;
  const canManage = isWorkspaceAdmin || isMaster;

  const handleCardClick = () => {
    onTeamClick?.(team.$id);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
        "cursor-pointer border-border/40",
        compact ? "h-auto" : "h-full"
      )}
      onClick={handleCardClick}
    >
      {/* Top Gradient Accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Space Ribbon (if belongs to a space) */}
      {showSpaceLabel && space && (
        <div className="absolute top-3 -right-8 rotate-45 z-10">
          <div 
            className="px-8 py-0.5 text-[9px] font-bold text-white shadow-sm"
            style={{ backgroundColor: space.color || "#6366f1" }}
          >
            {space.key}
          </div>
        </div>
      )}

      <CardContent className={cn("p-0", compact ? "p-3" : "")}>
        {/* Header Section */}
        <div className={cn(
          "flex items-start gap-3",
          compact ? "" : "p-4 pb-3"
        )}>
          {/* Team Avatar */}
          <Avatar className={cn(
            "rounded-xl border-2 border-background shadow-sm shrink-0",
            compact ? "size-10" : "size-14"
          )}>
            {team.imageUrl ? (
              <AvatarImage src={team.imageUrl} alt={team.name} />
            ) : (
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 text-white font-bold">
                <span className={compact ? "text-sm" : "text-lg"}>
                  {team.name.substring(0, 2).toUpperCase()}
                </span>
              </AvatarFallback>
            )}
          </Avatar>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            {/* Space Label */}
            {showSpaceLabel && space && !compact && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="mb-1.5 text-[9px] px-1.5 py-0 h-4 font-medium cursor-help"
                      style={{ 
                        backgroundColor: `${space.color}15`, 
                        borderColor: `${space.color}40`,
                        color: space.color || "#6366f1"
                      }}
                    >
                      <Sparkles className="size-2 mr-0.5" />
                      {space.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      This team belongs to <strong>{space.name}</strong> space. 
                      Only projects from this space can be assigned to this team.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Team Name */}
            <h3 className={cn(
              "font-semibold truncate group-hover:text-primary transition-colors",
              compact ? "text-sm" : "text-base"
            )}>
              {team.name}
            </h3>

            {/* Visibility Badge */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "mt-1 font-normal cursor-help",
                      compact ? "text-[9px] h-4 px-1" : "text-[10px] h-5 px-1.5",
                      visibilityConfig.color
                    )}
                  >
                    <VisibilityIcon className={cn(compact ? "size-2 mr-0.5" : "size-2.5 mr-1")} />
                    {visibilityConfig.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">{visibilityConfig.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Remove from space button (if in space context) */}
            {onRemoveFromSpace && canManage && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => onRemoveFromSpace(team.$id, e)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove from space</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Dropdown Menu */}
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEditTeam && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTeam(team.$id);
                      }}
                      className="text-xs"
                    >
                      <Settings className="size-3.5 mr-2" />
                      Team Settings
                    </DropdownMenuItem>
                  )}
                  {onDeleteTeam && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTeam(team.$id);
                        }}
                        className="text-xs text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete Team
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Description (non-compact only) */}
        {!compact && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
              {team.description || "No description provided"}
            </p>
          </div>
        )}

        {/* Stats & Members Section */}
        <div className={cn(
          "flex items-center justify-between",
          compact 
            ? "mt-2 pt-2 border-t border-border/40" 
            : "px-4 py-3 bg-muted/30 border-t border-border/40"
        )}>
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Projects Count */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <FolderKanban className="size-3" />
                    <span className="font-medium">
                      {isLoadingProjects ? "..." : projects.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {projects.length} {projects.length === 1 ? "project" : "projects"} assigned
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Members Count */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Users className="size-3" />
                    <span className="font-medium">
                      {isLoadingMembers ? "..." : members.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Member Avatars */}
          <TooltipProvider>
            <div className="flex -space-x-2">
              {isLoadingMembers ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="size-6 rounded-full bg-muted animate-pulse border-2 border-background" />
                  ))}
                </>
              ) : members.length === 0 ? (
                <span className="text-xs text-muted-foreground">No members</span>
              ) : (
                <>
                  {displayMembers.map((member) => {
                    const isLead = member.role === TeamMemberRole.LEAD;

                    return (
                      <Tooltip key={member.$id}>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Avatar className={cn(
                              "border-2 border-background ring-1 ring-border/50 hover:ring-2 hover:ring-primary transition-all cursor-pointer",
                              compact ? "size-5" : "size-6"
                            )}>
                              {member.user?.profileImageUrl ? (
                                <AvatarImage src={member.user.profileImageUrl} alt={member.user?.name || 'Member'} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[8px] font-semibold">
                                  {member.user?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2) || "?"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            {isLead && (
                              <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-0.5 shadow-sm">
                                <Crown className="size-1.5 text-white" />
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="space-y-0.5">
                            <p className="font-semibold">{member.user?.name || 'Unknown'}</p>
                            {isLead && (
                              <p className="text-amber-500 font-medium flex items-center gap-1">
                                <Crown className="size-2.5" />
                                Team Lead
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {remainingCount > 0 && (
                    <div className={cn(
                      "rounded-full bg-muted border-2 border-background flex items-center justify-center",
                      compact ? "size-5" : "size-6"
                    )}>
                      <span className="text-[8px] font-semibold text-muted-foreground">
                        +{remainingCount}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </TooltipProvider>

          {/* Chevron for navigation indication */}
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTeamCard;
