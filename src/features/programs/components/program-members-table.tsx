"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { PopulatedProgramMember, ProgramMemberRole } from "../types";
import { useGetProgramMembers, useAddProgramMember, useRemoveProgramMember, useUpdateProgramMemberRole } from "../api/index";

interface ProgramMembersTableProps {
  programId: string;
  workspaceId: string;
  canManageMembers?: boolean;
}

const roleColors: Record<ProgramMemberRole, string> = {
  [ProgramMemberRole.LEAD]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  [ProgramMemberRole.ADMIN]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [ProgramMemberRole.MEMBER]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  [ProgramMemberRole.VIEWER]: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const roleLabels: Record<ProgramMemberRole, string> = {
  [ProgramMemberRole.LEAD]: "Program Lead",
  [ProgramMemberRole.ADMIN]: "Admin",
  [ProgramMemberRole.MEMBER]: "Member",
  [ProgramMemberRole.VIEWER]: "Viewer",
};

export function ProgramMembersTable({
  programId,
  workspaceId: _workspaceId,
  canManageMembers = false,
}: ProgramMembersTableProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = _workspaceId; // Reserved for future use
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<PopulatedProgramMember | null>(null);

  const { data: membersData, isLoading } = useGetProgramMembers({ programId });
  const { mutate: _addMember, isPending: isAddingMember } = useAddProgramMember();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const __ = _addMember; // Reserved for future use in add member dialog
  const { mutate: removeMember, isPending: isRemovingMember } = useRemoveProgramMember();
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateProgramMemberRole();

  const members = membersData?.data?.documents ?? [];

  // Filter members based on search and role
  const filteredMembers = members.filter((member: PopulatedProgramMember) => {
    const matchesSearch = !searchQuery || 
      member.member?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.member?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (memberId: string, newRole: ProgramMemberRole) => {
    updateRole({
      programId,
      memberId,
      role: newRole,
    });
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    
    removeMember(
      { programId, memberId: memberToRemove.$id },
      {
        onSuccess: () => {
          setMemberToRemove(null);
        },
      }
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[200px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="manager">Managers</SelectItem>
              <SelectItem value="member">Members</SelectItem>
              <SelectItem value="viewer">Viewers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canManageMembers && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Program Member</DialogTitle>
                <DialogDescription>
                  Add a workspace member to this program. They will be able to view and contribute to program projects based on their role.
                </DialogDescription>
              </DialogHeader>
              {/* Add member form would go here - typically a member selector */}
              <div className="py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Member selector component to be integrated
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={isAddingMember}>
                  {isAddingMember ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
          {roleFilter !== "all" && ` (filtered)`}
        </span>
      </div>

      {/* Members table */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No members found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || roleFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Add members to start collaborating on this program"}
          </p>
          {canManageMembers && !searchQuery && roleFilter === "all" && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Member
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManageMembers && <TableHead className="w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member: PopulatedProgramMember) => (
                <TableRow key={member.$id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.member?.imageUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.member?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.member?.name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.member?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canManageMembers && member.role !== ProgramMemberRole.LEAD ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.$id, value as ProgramMemberRole)
                        }
                        disabled={isUpdatingRole}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ProgramMemberRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={ProgramMemberRole.MEMBER}>Member</SelectItem>
                          <SelectItem value={ProgramMemberRole.VIEWER}>Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="secondary"
                        className={roleColors[member.role as ProgramMemberRole]}
                      >
                        {roleLabels[member.role as ProgramMemberRole] || member.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </TableCell>
                  {canManageMembers && (
                    <TableCell>
                      {member.role !== ProgramMemberRole.LEAD && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove from program
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Remove member confirmation dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">
                {memberToRemove?.member?.name || "this member"}
              </span>{" "}
              from this program? They will lose access to program-specific features but
              can still access their assigned projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingMember ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
