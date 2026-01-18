"use client";

import { useState } from "react";
import { X, Plus, Users, Loader2, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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

import { useGetDepartmentMembers } from "../api/use-get-department-members";
import { useAddDepartmentMember } from "../api/use-add-department-member";
import { useRemoveDepartmentMember } from "../api/use-remove-department-member";
import { useGetOrgMembers, OrgMember } from "@/features/organizations/api/use-get-org-members";
import { PopulatedDepartment } from "../types";

interface DepartmentMembersDialogProps {
    orgId: string;
    department: PopulatedDepartment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Department Members Dialog
 * 
 * Allows admins to view and manage members in a department.
 * 
 * GOVERNANCE:
 * - Departments OWN members (for org-level access)
 * - Members gain org permissions ONLY through their departments
 * - Removing a member from ALL departments removes their org access
 */
export function DepartmentMembersDialog({
    orgId,
    department,
    open,
    onOpenChange,
}: DepartmentMembersDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; name: string } | null>(null);

    // Use department.organizationId to ensure consistency
    const actualOrgId = department.organizationId || orgId;

    const { data: departmentMembers, isLoading: membersLoading } = useGetDepartmentMembers({
        orgId: actualOrgId,
        departmentId: department.$id,
    });

    // Get all org members to show available ones
    const { data: allOrgMembers, isLoading: orgMembersLoading } = useGetOrgMembers({
        organizationId: actualOrgId,
    });

    const addMember = useAddDepartmentMember();
    const removeMember = useRemoveDepartmentMember();

    // Get members not yet in this department
    const departmentMemberIds = new Set(departmentMembers.map((m) => m.$id));

    const availableMembers = (allOrgMembers?.documents || []).filter(
        (m: OrgMember) => !departmentMemberIds.has(m.$id) && m.role !== "OWNER"
    );

    const filteredAvailableMembers = availableMembers.filter(member => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            member.name?.toLowerCase().includes(query) ||
            member.email?.toLowerCase().includes(query)
        );
    });

    const handleToggleMember = (memberId: string) => {
        const next = new Set(selectedIds);
        if (next.has(memberId)) {
            next.delete(memberId);
        } else {
            next.add(memberId);
        }
        setSelectedIds(next);
    };

    const handleBulkAdd = async () => {
        if (selectedIds.size === 0) return;
        setIsAdding(true);
        try {
            const promises = Array.from(selectedIds).map(orgMemberId =>
                addMember.mutateAsync({
                    orgId: actualOrgId,
                    departmentId: department.$id,
                    orgMemberId,
                })
            );
            await Promise.all(promises);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Failed to add members", error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveMember = () => {
        if (!confirmRemove) return;

        removeMember.mutate(
            { orgId: actualOrgId, departmentId: department.$id, orgMemberId: confirmRemove.memberId },
            { onSuccess: () => setConfirmRemove(null) }
        );
    };

    const isLoading = membersLoading || orgMembersLoading;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="size-5" />
                            Members - {department.name}
                        </DialogTitle>
                        <DialogDescription>
                            Manage members in this department. Members gain access to
                            organization features based on this department&apos;s permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                        {/* Add Members Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Add Members</h4>
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search members to add..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="rounded-md border h-48 overflow-y-auto p-1 bg-muted/10">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : filteredAvailableMembers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
                                            {availableMembers.length === 0
                                                ? "All eligible members added"
                                                : "No members found matching search"}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredAvailableMembers.map((member) => {
                                                const isSelected = selectedIds.has(member.$id);
                                                return (
                                                    <div
                                                        key={member.$id}
                                                        className={`
                                                            flex items-center gap-3 p-2 rounded-sm cursor-pointer hover:bg-muted 
                                                            ${isSelected ? "bg-muted" : ""}
                                                        `}
                                                        onClick={() => handleToggleMember(member.$id)}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleToggleMember(member.$id)}
                                                            className="pointer-events-none" // Handle clicks via parent div
                                                        />
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <Avatar className="size-6">
                                                                <AvatarImage src={member.profileImageUrl || undefined} />
                                                                <AvatarFallback className="text-[10px]">
                                                                    {member.name?.[0]?.toUpperCase() || "?"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="truncate">
                                                                <p className="text-sm font-medium leading-none truncate">{member.name}</p>
                                                                <p className="text-xs text-muted-foreground truncate opacity-80">{member.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleBulkAdd}
                                    disabled={selectedIds.size === 0 || isAdding}
                                >
                                    {isAdding ? (
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                    ) : (
                                        <Plus className="size-4 mr-2" />
                                    )}
                                    Add {selectedIds.size > 0 ? `${selectedIds.size} Selected` : "Selected"}
                                </Button>
                            </div>
                        </div>

                        {/* Current Members Section */}
                        <div className="space-y-3 pt-2 border-t">
                            <h4 className="text-sm font-medium flex items-center justify-between">
                                <span>Current Members</span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {departmentMembers.length}
                                </span>
                            </h4>

                            {departmentMembers.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2 text-center italic">
                                    No members in this department yet.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {departmentMembers.map((member) => (
                                        <div
                                            key={member.$id}
                                            className="flex items-center justify-between p-2 rounded-md border bg-card/50"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="size-8">
                                                    <AvatarImage src={member.profileImageUrl || undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {member.name?.[0]?.toUpperCase() || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => setConfirmRemove({
                                                    memberId: member.$id,
                                                    name: member.name
                                                })}
                                                disabled={removeMember.isPending}
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground border">
                            <strong>Note:</strong> Removing a member from all departments will
                            revoke their org-level access entirely.
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Remove Dialog */}
            <AlertDialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-destructive" />
                            Remove Member
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>
                                    Are you sure you want to remove <strong>{confirmRemove?.name}</strong> from
                                    &quot;{department.name}&quot;?
                                </p>
                                <p className="text-destructive font-medium">
                                    ⚠️ If this is their only department, they will lose all org access.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            disabled={removeMember.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removeMember.isPending ? (
                                <Loader2 className="size-4 animate-spin mr-2" />
                            ) : null}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
