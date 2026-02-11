"use client";

import { useState, useMemo } from "react";
import { MoreHorizontal, Plus, Search, Trash2, UserPlus, Users, Shield, Eye, Crown, Loader2, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";

import { PopulatedProgramMember, ProgramMemberRole } from "../types";
import { useGetProgramMembers } from "../api/use-get-program-members";
import { useAddProgramMember } from "../api/use-add-program-member";
import { useRemoveProgramMember } from "../api/use-remove-program-member";
import { useUpdateProgramMemberRole } from "../api/use-update-program-member";
import { useGetMembers } from "@/features/members/api/use-get-members";

interface ProgramMembersTableProps {
  programId: string;
  workspaceId: string;
  canManageMembers?: boolean;
}

const ROLE_CONFIG: Record<ProgramMemberRole, { label: string; icon: typeof Crown; badge: string }> = {
  [ProgramMemberRole.LEAD]: { label: "Lead", icon: Crown, badge: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 dark:text-purple-400" },
  [ProgramMemberRole.ADMIN]: { label: "Admin", icon: Shield, badge: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400" },
  [ProgramMemberRole.MEMBER]: { label: "Member", icon: Users, badge: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-400" },
  [ProgramMemberRole.VIEWER]: { label: "Viewer", icon: Eye, badge: "bg-gray-500/10 text-gray-500 border-gray-200 dark:border-gray-700 dark:text-gray-400" },
};

export function ProgramMembersTable({ programId, workspaceId, canManageMembers = false }: ProgramMembersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addRole, setAddRole] = useState<ProgramMemberRole>(ProgramMemberRole.MEMBER);
  const [memberToRemove, setMemberToRemove] = useState<PopulatedProgramMember | null>(null);

  const { data: membersData, isLoading } = useGetProgramMembers({ programId });
  const { mutate: addMember, isPending: isAdding } = useAddProgramMember();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveProgramMember();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateProgramMemberRole();
  const { data: workspaceMembers, isLoading: isLoadingWorkspace } = useGetMembers({ workspaceId, enabled: addOpen });

  const members = useMemo(() => membersData?.data?.documents ?? [], [membersData?.data?.documents]);

  // Existing member user IDs for filtering the add dialog
  const existingUserIds = useMemo(() => new Set(members.map((m: PopulatedProgramMember) => m.user?.email ? m.userId : m.userId)), [members]);

  // Available workspace members (not already in program)
  const availableMembers = useMemo(() => {
    const allWs = (workspaceMembers?.documents ?? []) as Array<{ $id: string; userId: string; name?: string; email?: string; role?: string }>;
    const filtered = allWs.filter((wm) => !existingUserIds.has(wm.$id));
    if (!addSearch) return filtered;
    return filtered.filter((wm) =>
      (wm.name || "").toLowerCase().includes(addSearch.toLowerCase()) ||
      (wm.email || "").toLowerCase().includes(addSearch.toLowerCase())
    );
  }, [workspaceMembers, existingUserIds, addSearch]);

  const filtered = members.filter((m: PopulatedProgramMember) => {
    const matchSearch = !search || m.user?.name?.toLowerCase().includes(search.toLowerCase()) || m.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleRole = (id: string, role: ProgramMemberRole) => updateRole({ programId, memberId: id, role });
  const handleRemove = () => {
    if (!memberToRemove) return;
    removeMember({ programId, memberId: memberToRemove.$id }, { onSuccess: () => setMemberToRemove(null) });
  };
  const handleAddMember = (userId: string) => {
    addMember(
      { programId, userId, role: addRole },
      { onSuccess: () => { setAddSearch(""); setAddRole(ProgramMemberRole.MEMBER); setAddOpen(false); } }
    );
  };
  const initials = (name?: string) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  // Role counts
  const roleCounts = members.reduce((acc: Record<string, number>, m: PopulatedProgramMember) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {} as Record<string, number>);

  if (isLoading) return <MembersSkeleton />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Program Members
            <Badge variant="secondary" className="ml-1 tabular-nums">{members.length}</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">People contributing to this program</p>
        </div>
        {canManageMembers && (
          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setAddSearch(""); setAddRole(ProgramMemberRole.MEMBER); } }}>
            <DialogTrigger asChild><Button size="sm" className="gap-2"><UserPlus className="h-4 w-4" />Add Member</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Program Member</DialogTitle>
                <DialogDescription>Select a workspace member to add to this program. They&apos;ll gain access based on their assigned role.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Role selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Role</label>
                  <Select value={addRole} onValueChange={(v) => setAddRole(v as ProgramMemberRole)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProgramMemberRole.ADMIN}>Admin — Can manage projects & members</SelectItem>
                      <SelectItem value={ProgramMemberRole.MEMBER}>Member — Can view and update items</SelectItem>
                      <SelectItem value={ProgramMemberRole.VIEWER}>Viewer — Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search workspace members..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)} className="pl-9" />
                </div>
                {/* Member list */}
                {isLoadingWorkspace ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : availableMembers.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">{addSearch ? "No members match your search" : "All workspace members are already in this program"}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[260px]">
                    <div className="space-y-1">
                      {availableMembers.map((wm) => (
                        <button
                          key={wm.$id}
                          onClick={() => handleAddMember(wm.$id)}
                          disabled={isAdding}
                          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {initials(wm.name || wm.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{wm.name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground truncate">{wm.email}</p>
                          </div>
                          {isAdding && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role pills */}
      {members.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
            const count = roleCounts[role] || 0;
            if (count === 0) return null;
            const RoleIcon = cfg.icon;
            return (
              <Badge key={role} variant="outline" className={cn("gap-1 text-xs px-2 py-0.5", cfg.badge)}>
                <RoleIcon className="h-3 w-3" />{cfg.label} <span className="font-bold tabular-nums">{count}</span>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filters */}
      {members.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value={ProgramMemberRole.LEAD}>Leads</SelectItem>
              <SelectItem value={ProgramMemberRole.ADMIN}>Admins</SelectItem>
              <SelectItem value={ProgramMemberRole.MEMBER}>Members</SelectItem>
              <SelectItem value={ProgramMemberRole.VIEWER}>Viewers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Members */}
      {members.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Users className="h-7 w-7 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">No members yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">Add team members to start collaborating on this program.</p>
            {canManageMembers && <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add First Member</Button>}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-10"><Search className="h-8 w-8 text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">No members match your filters</p></div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((member: PopulatedProgramMember) => {
            const cfg = ROLE_CONFIG[member.role as ProgramMemberRole] || ROLE_CONFIG[ProgramMemberRole.MEMBER];
            const RoleIcon = cfg.icon;
            const isLead = member.role === ProgramMemberRole.LEAD;

            return (
              <Card key={member.$id} className="group transition-all hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user?.profileImageUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials(member.user?.name)}</AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{member.user?.name || "Unknown"}</p>
                        {isLead && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{member.user?.email || "No email"}</p>
                    </div>

                    {/* Role */}
                    {canManageMembers && !isLead ? (
                      <Select value={member.role} onValueChange={(v) => handleRole(member.$id, v as ProgramMemberRole)} disabled={isUpdating}>
                        <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ProgramMemberRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={ProgramMemberRole.MEMBER}>Member</SelectItem>
                          <SelectItem value={ProgramMemberRole.VIEWER}>Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn("text-xs gap-1 px-2", cfg.badge)}>
                        <RoleIcon className="h-3 w-3" />{cfg.label}
                      </Badge>
                    )}

                    {/* Joined */}
                    <span className="text-xs text-muted-foreground hidden sm:block tabular-nums w-24 text-right">
                      {new Date(member.addedAt || member.$createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>

                    {/* Actions */}
                    {canManageMembers && !isLead && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setMemberToRemove(member)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Remove confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(o) => !o && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <span className="font-medium">{memberToRemove?.user?.name || "this member"}</span> from this program? They&apos;ll lose access to program features but can still access assigned projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isRemoving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isRemoving ? "Removing..." : "Remove"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────── */
function MembersSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><Skeleton className="h-6 w-40" /><Skeleton className="h-9 w-28" /></div>
      <div className="flex gap-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" /></div>
      <div className="flex gap-3"><Skeleton className="h-9 w-72" /><Skeleton className="h-9 w-28" /></div>
      <div className="grid gap-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
    </div>
  );
}
