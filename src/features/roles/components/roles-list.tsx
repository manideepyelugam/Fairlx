"use client";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { client } from "@/lib/rpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { RoleEditorModal } from "./role-editor-modal";
import { useConfirm } from "@/hooks/use-confirm";

import { CustomRole } from "@/features/teams/types";

export const RolesList = () => {
    const workspaceId = useWorkspaceId();
    const queryClient = useQueryClient();
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

    const [ConfirmDeleteDialog, confirmDelete] = useConfirm(
        "Delete Role",
        "Are you sure you want to delete this role? Users with this role may lose access permissions.",
        "destructive"
    );

    const { data: roles, isLoading } = useQuery({
        queryKey: ["roles", workspaceId],
        queryFn: async () => {
            const response = await client.api.roles.$get({
                query: { workspaceId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch roles");
            }

            const { data } = await response.json();
            return data as { documents: CustomRole[], total: number };
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: { name: string; permissions: string[] }) => {
            const response = await client.api.roles.$post({
                json: { ...values, workspaceId }
            });
            if (!response.ok) throw new Error("Failed to create role");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles", workspaceId] });
            toast.success("Role created successfully");
            setEditorOpen(false);
        },
        onError: () => toast.error("Failed to create role")
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, values }: { id: string, values: { name: string; permissions: string[] } }) => {
            const response = await client.api.roles[":roleId"].$patch({
                param: { roleId: id },
                json: values
            });
            if (!response.ok) throw new Error("Failed to update role");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles", workspaceId] });
            toast.success("Role updated successfully");
            setEditorOpen(false);
            setEditingRole(null);
        },
        onError: () => toast.error("Failed to update role")
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await client.api.roles[":roleId"].$delete({
                param: { roleId: id }
            });
            if (!response.ok) throw new Error("Failed to delete role");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles", workspaceId] });
            toast.success("Role deleted successfully");
        },
        onError: () => toast.error("Failed to delete role")
    });

    const handleCreate = (values: { name: string; permissions: string[] }) => {
        createMutation.mutate(values);
    };

    const handleUpdate = (values: { name: string; permissions: string[] }) => {
        if (editingRole) {
            updateMutation.mutate({ id: editingRole.$id, values });
        }
    };

    const handleDelete = async (role: CustomRole) => {
        const ok = await confirmDelete();
        if (ok) {
            deleteMutation.mutate(role.$id);
        }
    };

    const openCreate = () => {
        setEditingRole(null);
        setEditorOpen(true);
    };

    const openEdit = (role: CustomRole) => {
        setEditingRole(role);
        setEditorOpen(true);
    };

    return (
        <div className="space-y-6">
            <ConfirmDeleteDialog />
            <RoleEditorModal
                open={editorOpen}
                onOpenChange={setEditorOpen}
                initialData={editingRole}
                onSubmit={editingRole ? handleUpdate : handleCreate}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">Custom Roles</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage custom roles and their permissions for this workspace.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="size-4" />
                    Create Role
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Defined Roles</CardTitle>
                    <CardDescription>
                        System roles and custom roles available in your workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* System Roles (Read Only for now, just visual placeholder or skip?) 
                            Let's skip system roles here or check if we want to list default ones?
                            The user asked to create "their own roles". Let's focus on customs.
                        */}
                                {roles?.documents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            No custom roles defined yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {roles?.documents.map((role: CustomRole) => (
                                    <TableRow key={role.$id}>
                                        <TableCell className="font-medium">
                                            {role.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions?.length > 0 ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        {role.permissions.length} permissions
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No permissions</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => openEdit(role)}>
                                                    <Pencil className="size-4 text-muted-foreground" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(role)}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Alert about System Roles */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-800">
                    <ShieldAlert className="size-5" />
                    <p className="text-sm font-medium">System Roles</p>
                </div>
                <p className="mt-1 text-sm text-amber-700">
                    Built-in roles (Admin, Developer, Viewer) cannot be modified here. You can assign them to members in the Members list.
                </p>
            </div>
        </div>
    );
};
