"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useGetDepartmentPermissions } from "../api/use-get-department-permissions";
import { useAddDepartmentPermission } from "../api/use-add-department-permission";
import { useRemoveDepartmentPermission } from "../api/use-remove-department-permission";
import { OrgPermissionKey, ORG_PERMISSION_METADATA, PERMISSION_CATEGORIES } from "@/features/org-permissions/types";
import { PopulatedDepartment } from "../types";

interface DepartmentPermissionsDialogProps {
    orgId: string;
    department: PopulatedDepartment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Department Permissions Dialog
 * 
 * Allows admins to view and manage permissions assigned to a department.
 * 
 * GOVERNANCE:
 * - Departments OWN permissions
 * - Members inherit permissions from their departments
 * - Permissions are UNIONed across all member's departments
 */
export function DepartmentPermissionsDialog({
    orgId,
    department,
    open,
    onOpenChange,
}: DepartmentPermissionsDialogProps) {
    const [pendingPermissions, setPendingPermissions] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Use department.organizationId to ensure consistency with backend validation
    const actualOrgId = department.organizationId || orgId;

    const { data: permissions, isLoading } = useGetDepartmentPermissions({
        orgId: actualOrgId,
        departmentId: department.$id,
    });

    const addPermission = useAddDepartmentPermission();
    const removePermission = useRemoveDepartmentPermission();

    // Initialize state when permissions load
    useEffect(() => {
        if (permissions) {
            setPendingPermissions(new Set(permissions.map((p) => p.permissionKey)));
        }
    }, [permissions]);

    const handleTogglePermission = (permissionKey: string) => {
        const next = new Set(pendingPermissions);
        if (next.has(permissionKey)) {
            next.delete(permissionKey);
        } else {
            next.add(permissionKey);
        }
        setPendingPermissions(next);

        // Check if different from initial
        const currentKeys = new Set(permissions.map(p => p.permissionKey));
        // Simple check: same size and every item in next is in current
        const isSame = next.size === currentKeys.size && [...next].every(k => currentKeys.has(k));
        setHasChanges(!isSame);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const currentKeys = permissions.map(p => p.permissionKey);
            const toAdd = [...pendingPermissions].filter(key => !currentKeys.includes(key));
            const toRemove = currentKeys.filter(key => !pendingPermissions.has(key));

            // Execute additions
            for (const key of toAdd) {
                await addPermission.mutateAsync({
                    orgId: actualOrgId,
                    departmentId: department.$id,
                    permissionKey: key,
                });
            }

            // Execute removals
            for (const key of toRemove) {
                await removePermission.mutateAsync({
                    orgId: actualOrgId,
                    departmentId: department.$id,
                    permissionKey: key,
                });
            }

            setHasChanges(false);
            onOpenChange(false);
        } catch {
            // Error handled silently
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        Permissions - {department.name}
                    </DialogTitle>
                    <DialogDescription>
                        Manage permissions for this department. Members will inherit these permissions.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {PERMISSION_CATEGORIES.map((category) => (
                                <div key={category.id} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-foreground">
                                            {category.label}
                                        </h4>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {category.permissions.map((permKey) => {
                                            const metadata = ORG_PERMISSION_METADATA[permKey as OrgPermissionKey];
                                            if (!metadata) return null;

                                            const isChecked = pendingPermissions.has(permKey);

                                            return (
                                                <div
                                                    key={permKey}
                                                    className={`
                                                        flex items-start gap-3 p-3 rounded-md border 
                                                        transition-colors cursor-pointer
                                                        ${isChecked
                                                            ? "bg-primary/5 border-primary/20"
                                                            : "bg-card hover:bg-muted/50"}
                                                    `}
                                                    onClick={() => handleTogglePermission(permKey)}
                                                >
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={() => handleTogglePermission(permKey)}
                                                        id={permKey}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="space-y-1">
                                                        <label
                                                            htmlFor={permKey}
                                                            className="text-sm font-medium leading-none cursor-pointer"
                                                        >
                                                            {metadata.label}
                                                        </label>
                                                        <p className="text-xs text-muted-foreground leading-snug">
                                                            {metadata.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t pt-4 mt-2">
                    <div className="text-xs text-muted-foreground">
                        {pendingPermissions.size} permissions selected
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving && <Loader2 className="size-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
