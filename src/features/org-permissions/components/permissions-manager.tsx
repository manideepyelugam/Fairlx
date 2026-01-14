"use client";

import { useState } from "react";
import { Shield, Loader2, Check, X, ChevronDown, ChevronRight, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useGetAllOrgPermissions } from "../api/use-get-all-permissions";
import { useBulkGrantPermissions, useRevokePermission } from "../api/use-manage-permissions";
import {
    OrgPermissionKey,
    ORG_PERMISSION_METADATA,
    PERMISSION_CATEGORIES,
} from "../types";

interface PermissionsManagerProps {
    orgId: string;
    isOwner: boolean;
}

export function PermissionsManager({ orgId, isOwner }: PermissionsManagerProps) {
    const { data: members, isLoading } = useGetAllOrgPermissions({ orgId });
    const [selectedMember, setSelectedMember] = useState<{
        memberId: string;
        name: string;
        email: string;
        role: string;
        isOwner: boolean;
        permissions: string[];
    } | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                    </div>
                ))}
            </div>
        );
    }

    const handleSelectMember = (member: typeof members extends (infer T)[] | undefined ? T : never) => {
        if (!member) return;
        setSelectedMember({
            memberId: member.memberId,
            name: member.name || member.email || "Unknown",
            email: member.email || "",
            role: member.role,
            isOwner: member.isOwner,
            permissions: member.permissions,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Shield className="size-5" />
                        Permissions
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage explicit permissions for organization members
                    </p>
                </div>
            </div>

            {/* Members List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="size-4" />
                        Member Permissions
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Click on a member to view and manage their permissions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {members?.map((member) => (
                            <div
                                key={member.memberId}
                                className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer"
                                onClick={() => handleSelectMember(member)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                        {(member.name || member.email || "?")[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{member.name || member.email}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {member.role}
                                            </Badge>
                                            {member.isOwner && (
                                                <Badge className="text-xs bg-amber-500">OWNER</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{member.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {member.permissions.length} permissions
                                    </Badge>
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Permissions Dialog */}
            {selectedMember && (
                <EditPermissionsDialog
                    orgId={orgId}
                    member={selectedMember}
                    isOwner={isOwner}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </div>
    );
}

// Edit Permissions Dialog
function EditPermissionsDialog({
    orgId,
    member,
    isOwner,
    onClose,
}: {
    orgId: string;
    member: {
        memberId: string;
        name: string;
        email: string;
        role: string;
        isOwner: boolean;
        permissions: string[];
    };
    isOwner: boolean;
    onClose: () => void;
}) {
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
        new Set(member.permissions)
    );
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["billing", "members"]));

    const { mutate: bulkGrant, isPending: isGranting } = useBulkGrantPermissions({ orgId });
    const { mutate: revoke, isPending: isRevoking } = useRevokePermission({ orgId });

    const isPending = isGranting || isRevoking;
    const canEdit = isOwner && !member.isOwner;

    const toggleCategory = (categoryId: string) => {
        const newOpen = new Set(openCategories);
        if (newOpen.has(categoryId)) {
            newOpen.delete(categoryId);
        } else {
            newOpen.add(categoryId);
        }
        setOpenCategories(newOpen);
    };

    const togglePermission = (permission: string) => {
        const newSelected = new Set(selectedPermissions);
        if (newSelected.has(permission)) {
            newSelected.delete(permission);
        } else {
            newSelected.add(permission);
        }
        setSelectedPermissions(newSelected);
    };

    const handleSave = async () => {
        if (!canEdit) return;

        const currentPerms = new Set(member.permissions);
        const toGrant = [...selectedPermissions].filter((p) => !currentPerms.has(p));
        const toRevoke = [...currentPerms].filter((p) => !selectedPermissions.has(p));

        // Revoke first
        for (const perm of toRevoke) {
            revoke({ orgMemberId: member.memberId, permissionKey: perm });
        }

        // Then grant
        if (toGrant.length > 0) {
            bulkGrant({ orgMemberId: member.memberId, permissionKeys: toGrant });
        }

        onClose();
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        Edit Permissions: {member.name}
                    </DialogTitle>
                    <DialogDescription>
                        {member.isOwner
                            ? "Owners have all permissions by default and cannot be modified."
                            : canEdit
                                ? "Select the permissions to grant to this member."
                                : "Only the organization owner can modify permissions."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {PERMISSION_CATEGORIES.map((category) => (
                        <Collapsible
                            key={category.id}
                            open={openCategories.has(category.id)}
                            onOpenChange={() => toggleCategory(category.id)}
                        >
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-2">
                                    {openCategories.has(category.id) ? (
                                        <ChevronDown className="size-4" />
                                    ) : (
                                        <ChevronRight className="size-4" />
                                    )}
                                    <span className="font-medium text-sm">{category.label}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {category.permissions.filter((p) => selectedPermissions.has(p)).length}/
                                    {category.permissions.length}
                                </Badge>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-2 pl-6 space-y-2">
                                {category.permissions.map((permission) => {
                                    const meta = ORG_PERMISSION_METADATA[permission];
                                    const isChecked = selectedPermissions.has(permission);
                                    return (
                                        <div
                                            key={permission}
                                            className={`flex items-start gap-3 p-3 rounded-lg border ${isChecked ? "border-primary/30 bg-primary/5" : ""
                                                }`}
                                        >
                                            <Checkbox
                                                id={permission}
                                                checked={isChecked}
                                                disabled={!canEdit || member.isOwner}
                                                onCheckedChange={() => togglePermission(permission)}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={permission}
                                                    className="text-sm font-medium cursor-pointer"
                                                >
                                                    {meta.label}
                                                </label>
                                                <p className="text-xs text-muted-foreground">
                                                    {meta.description}
                                                </p>
                                                <code className="text-xs text-muted-foreground bg-muted px-1 rounded mt-1 inline-block">
                                                    {permission}
                                                </code>
                                            </div>
                                            {isChecked && (
                                                <Check className="size-4 text-primary shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {canEdit && (
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
