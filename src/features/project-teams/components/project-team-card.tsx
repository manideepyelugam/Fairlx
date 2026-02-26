"use client";

import { Users, MoreHorizontal, Trash2, UserPlus, Eye, Pencil, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { PopulatedProjectTeam } from "../types";

interface ProjectTeamCardProps {
    team: PopulatedProjectTeam;
    onAddMember?: () => void;
    onDelete?: () => void;
    onViewMembers?: () => void;
    onEdit?: () => void;
    onManagePermissions?: () => void;
    canManage?: boolean;
}

export function ProjectTeamCard({
    team,
    onAddMember,
    onDelete,
    onViewMembers,
    onEdit,
    onManagePermissions,
    canManage = false,
}: ProjectTeamCardProps) {
    return (
        <Card 
            className="group hover:shadow-md transition-shadow cursor-pointer"
            onClick={onViewMembers}
        >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: team.color || "#4F46E5" }}
                    >
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">
                            {team.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {team.memberCount} member{team.memberCount !== 1 ? "s" : ""} • Click to view
                        </CardDescription>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewMembers?.(); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Members
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Team
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddMember?.(); }}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Member
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManagePermissions?.(); }}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Manage Permissions
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Team
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardContent>
                {team.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {team.description}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground italic">
                        No description
                    </p>
                )}

                {team.members && team.members.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                        {team.members.slice(0, 5).map((member) => (
                            <Badge key={member.$id} variant="secondary" className="text-xs">
                                {member.user.name}
                                {member.teamRole && ` (${member.teamRole})`}
                            </Badge>
                        ))}
                        {team.members.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                                +{team.members.length - 5} more
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
