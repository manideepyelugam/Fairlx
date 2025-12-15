"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Shield, Save, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TeamPermission,
  PERMISSION_CATEGORIES,
  CustomRole,
} from "../types";
import { useConfirm } from "@/hooks/use-confirm";

interface RoleManagementProps {
  teamId: string;
  customRoles?: CustomRole[];
  onCreateRole?: (role: Omit<CustomRole, "$id" | "$createdAt" | "$updatedAt">) => void;
  onUpdateRole?: (roleId: string, role: Partial<CustomRole>) => void;
  onDeleteRole?: (roleId: string) => void;
}

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
];

export const RoleManagement = ({
  teamId,
  customRoles = [],
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: RoleManagementProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleColor, setRoleColor] = useState("blue");
  const [selectedPermissions, setSelectedPermissions] = useState<TeamPermission[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());


  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Role",
    "Are you sure you want to delete this role? Members with this role will need to be reassigned.",
    "destructive"
  );

  const handleOpenCreate = () => {
    setRoleName("");
    setRoleDescription("");
    setRoleColor("blue");
    setSelectedPermissions([]);
    setIsDefault(false);
    setEditingRole(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (role: CustomRole) => {
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setRoleColor(role.color || "blue");
    setSelectedPermissions(role.permissions);
    setIsDefault(role.isDefault || false);
    setEditingRole(role);
    setIsCreateOpen(true);
  };

  const handleClose = () => {
    setIsCreateOpen(false);
    setEditingRole(null);
  };

  const handleTogglePermission = (permission: TeamPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAllInCategory = (permissions: TeamPermission[]) => {
    const allSelected = permissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !permissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...permissions])]);
    }
  };

  const handleSave = () => {
    if (!roleName.trim()) return;

    const roleData = {
      teamId,
      name: roleName.trim(),
      description: roleDescription.trim() || undefined,
      color: roleColor,
      permissions: selectedPermissions,
      isDefault,
      createdBy: "", // Will be set on server
      lastModifiedBy: "",
    };

    if (editingRole) {
      onUpdateRole?.(editingRole.$id, roleData);
    } else {
      onCreateRole?.(roleData);
    }

    handleClose();
  };

  const handleDelete = async (roleId: string) => {
    const ok = await confirm();
    if (!ok) return;
    onDeleteRole?.(roleId);
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };



  return (
    <>
      <ConfirmDialog />

      <div className="space-y-4">


        {/* Custom Roles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Custom Roles</CardTitle>
                <CardDescription className="text-xs">
                  Create roles with specific permissions
                </CardDescription>
              </div>
              <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 h-8">
                <Plus className="size-3.5" />
                New Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {customRoles.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No custom roles yet</p>
                <Button onClick={handleOpenCreate} variant="outline" size="sm">
                  Create First Role
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {customRoles.map((role) => {
                  const isExpanded = expandedRoles.has(role.$id);
                  return (
                    <div
                      key={role.$id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="flex items-start justify-between p-3 group hover:bg-muted/30 transition-colors">
                        <div className="flex-1 flex items-start gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0 mt-0.5"
                            onClick={() => toggleRoleExpanded(role.$id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`${COLOR_OPTIONS.find((c) => c.value === role.color)?.class} text-white border-0`}
                              >
                                {role.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {role.permissions.length} Permissions
                              </span>
                              {role.isDefault && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                  Default
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleOpenEdit(role)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(role.$id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Permissions View */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 border-t bg-muted/20">
                          <div className="space-y-2 mt-3">
                            {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                              const categoryPerms = category.permissions.filter(p =>
                                role.permissions.includes(p.key)
                              );
                              if (categoryPerms.length === 0) return null;

                              return (
                                <div key={key} className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">
                                    {category.label}
                                  </div>
                                  {categoryPerms.map((perm) => (
                                    <div key={perm.key} className="text-xs pl-3 py-1">
                                      • {perm.label}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Custom Role"}</DialogTitle>
            <DialogDescription>
              Define a custom role with specific permissions for your team
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-200px)] pr-4">
            <div className="space-y-4">
              {/* Role Name */}
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  placeholder="e.g., Developer, Designer, QA Tester"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>

              {/* Role Description */}
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  placeholder="Brief description of this role"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label>Badge Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setRoleColor(color.value)}
                      className={`size-8 rounded-full ${color.class} ${roleColor === color.value ? "ring-2 ring-offset-2 ring-primary" : ""
                        }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Default Role */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <Label htmlFor="is-default" className="text-sm font-normal cursor-pointer">
                  Set as default role for new members
                </Label>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-3">
                <Label className="text-base">Permissions</Label>
                {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                  const categoryPermissions = category.permissions.map((p) => p.key);
                  const allSelected = categoryPermissions.every((p) =>
                    selectedPermissions.includes(p)
                  );

                  return (
                    <Card key={key}>
                      <CardHeader className="p-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{category.label}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleSelectAllInCategory(categoryPermissions)}
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2">
                        {category.permissions.map((permission) => (
                          <div
                            key={permission.key}
                            className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50"
                          >
                            <Checkbox
                              id={permission.key}
                              checked={selectedPermissions.includes(permission.key)}
                              onCheckedChange={() => handleTogglePermission(permission.key)}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={permission.key}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!roleName.trim()}>
              <Save className="size-4 mr-2" />
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
