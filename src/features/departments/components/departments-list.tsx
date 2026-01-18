"use client";

import { useState } from "react";
import { Plus, Building2, MoreHorizontal, Pencil, Trash2, Users, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { useGetDepartments } from "../api/use-get-departments";
import { useCreateDepartment } from "../api/use-create-department";
import { useUpdateDepartment } from "../api/use-update-department";
import { useDeleteDepartment } from "../api/use-delete-department";
import { PopulatedDepartment, DEPARTMENT_COLORS } from "../types";
import { DepartmentPermissionsDialog } from "./department-permissions-dialog";
import { DepartmentMembersDialog } from "./department-members-dialog";

interface DepartmentsListProps {
    orgId: string;
    canManage: boolean;
}

export function DepartmentsList({ orgId, canManage }: DepartmentsListProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<PopulatedDepartment | null>(null);
    const [deletingDepartment, setDeletingDepartment] = useState<PopulatedDepartment | null>(null);
    const [permissionsDepartment, setPermissionsDepartment] = useState<PopulatedDepartment | null>(null);
    const [membersDepartment, setMembersDepartment] = useState<PopulatedDepartment | null>(null);

    const { data, isLoading } = useGetDepartments({ orgId });
    const departments = data?.documents ?? [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Building2 className="size-5" />
                        Departments
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Organize members into departments for better management
                    </p>
                </div>
                {canManage && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="size-4 mr-2" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <CreateDepartmentDialog
                            orgId={orgId}
                            onClose={() => setIsCreateOpen(false)}
                        />
                    </Dialog>
                )}
            </div>

            {/* Departments Grid */}
            {departments.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="size-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            No departments yet.
                            {canManage && " Create your first department to organize members."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                        <DepartmentCard
                            key={dept.$id}
                            department={dept}
                            canManage={canManage}
                            onEdit={() => setEditingDepartment(dept)}
                            onDelete={() => setDeletingDepartment(dept)}
                            onManagePermissions={() => setPermissionsDepartment(dept)}
                            onManageMembers={() => setMembersDepartment(dept)}
                        />
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            {editingDepartment && (
                <Dialog open={!!editingDepartment} onOpenChange={() => setEditingDepartment(null)}>
                    <EditDepartmentDialog
                        orgId={orgId}
                        department={editingDepartment}
                        onClose={() => setEditingDepartment(null)}
                    />
                </Dialog>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingDepartment} onOpenChange={() => setDeletingDepartment(null)}>
                <DeleteDepartmentDialog
                    orgId={orgId}
                    department={deletingDepartment!}
                    onClose={() => setDeletingDepartment(null)}
                />
            </AlertDialog>

            {/* Permissions Dialog */}
            {permissionsDepartment && (
                <DepartmentPermissionsDialog
                    orgId={orgId}
                    department={permissionsDepartment}
                    open={!!permissionsDepartment}
                    onOpenChange={(open) => !open && setPermissionsDepartment(null)}
                />
            )}

            {/* Members Dialog */}
            {membersDepartment && (
                <DepartmentMembersDialog
                    orgId={orgId}
                    department={membersDepartment}
                    open={!!membersDepartment}
                    onOpenChange={(open) => !open && setMembersDepartment(null)}
                />
            )}
        </div>
    );
}

// Department Card Component
function DepartmentCard({
    department,
    canManage,
    onEdit,
    onDelete,
    onManagePermissions,
    onManageMembers,
}: {
    department: PopulatedDepartment;
    canManage: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onManagePermissions: () => void;
    onManageMembers: () => void;
}) {
    return (
        <Card className="relative overflow-hidden">
            <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: department.color || "#4F46E5" }}
            />
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-medium">{department.name}</CardTitle>
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onManageMembers}>
                                    <Users className="size-4 mr-2" />
                                    Members
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onManagePermissions}>
                                    <Shield className="size-4 mr-2" />
                                    Permissions
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                {department.description && (
                    <CardDescription className="text-xs line-clamp-2">
                        {department.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                <Badge variant="secondary" className="text-xs">
                    <Users className="size-3 mr-1" />
                    {department.memberCount ?? 0} members
                </Badge>
            </CardContent>
        </Card>
    );
}

// Create Department Dialog
function CreateDepartmentDialog({
    orgId,
    onClose,
}: {
    orgId: string;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState<string>(DEPARTMENT_COLORS[0]);

    const { mutate, isPending } = useCreateDepartment({ orgId });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate(
            { name, description: description || undefined, color },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <DialogContent>
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>Create Department</DialogTitle>
                    <DialogDescription>
                        Add a new department to organize members
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Engineering"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {DEPARTMENT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`size-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"
                                        }`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending || !name.trim()}>
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

// Edit Department Dialog
function EditDepartmentDialog({
    orgId,
    department,
    onClose,
}: {
    orgId: string;
    department: PopulatedDepartment;
    onClose: () => void;
}) {
    const [name, setName] = useState(department.name);
    const [description, setDescription] = useState(department.description || "");
    const [color, setColor] = useState<string>(department.color || DEPARTMENT_COLORS[0]);

    const { mutate, isPending } = useUpdateDepartment({ orgId });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate(
            { departmentId: department.$id, json: { name, description, color } },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <DialogContent>
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>Edit Department</DialogTitle>
                    <DialogDescription>
                        Update department details
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {DEPARTMENT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`size-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"
                                        }`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending || !name.trim()}>
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

// Delete Department Dialog
function DeleteDepartmentDialog({
    orgId,
    department,
    onClose,
}: {
    orgId: string;
    department: PopulatedDepartment | null;
    onClose: () => void;
}) {
    const { mutate, isPending } = useDeleteDepartment({ orgId });

    if (!department) return null;

    const handleDelete = () => {
        mutate({ departmentId: department.$id }, { onSuccess: () => onClose() });
    };

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Department</AlertDialogTitle>
                <AlertDialogDescription asChild>
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                            Are you sure you want to delete &quot;{department.name}&quot;?
                            This will remove all member assignments.
                        </p>
                        {(department.memberCount ?? 0) > 0 && (
                            <p className="text-destructive font-medium">
                                ⚠️ Warning: {department.memberCount} member(s) may lose org access
                                if this is their only department.
                            </p>
                        )}
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}
