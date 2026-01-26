"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ProjectPermissionKey } from "@/lib/permissions/types";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetProjectTeams } from "@/features/project-teams/api/use-get-project-teams";
import { useGetProjectRoles } from "@/features/project-members/api/use-get-project-roles";
import { useGetProjectTeamPermissions } from "@/features/project-teams/api/use-get-project-team-permissions";
import { useUpdateProjectTeamPermissions } from "@/features/project-teams/api/use-update-project-team-permissions";
import { useUpdateProjectRole } from "@/features/project-members/api/use-update-project-role";


// Group permissions for better UI
const PERMISSION_GROUPS = [
    {
        title: "Project",
        permissions: [
            { key: ProjectPermissionKey.VIEW_PROJECT, label: "View Project" },
            { key: ProjectPermissionKey.EDIT_SETTINGS, label: "Edit Settings" },
            { key: ProjectPermissionKey.DELETE_PROJECT, label: "Delete Project" },
        ],
    },
    {
        title: "Tasks & Work Items",
        permissions: [
            { key: ProjectPermissionKey.VIEW_TASKS, label: "View Tasks" },
            { key: ProjectPermissionKey.CREATE_TASKS, label: "Create Tasks" },
            { key: ProjectPermissionKey.EDIT_TASKS, label: "Edit Tasks" },
            { key: ProjectPermissionKey.DELETE_TASKS, label: "Delete Tasks" },
        ],
    },
    {
        title: "Sprints",
        permissions: [
            { key: ProjectPermissionKey.VIEW_SPRINTS, label: "View Sprints" },
            { key: ProjectPermissionKey.CREATE_SPRINTS, label: "Create Sprints" },
            { key: ProjectPermissionKey.EDIT_SPRINTS, label: "Edit Sprints" },
            { key: ProjectPermissionKey.DELETE_SPRINTS, label: "Delete Sprints" },
            { key: ProjectPermissionKey.START_SPRINT, label: "Start/Complete Sprint" },
        ],
    },
    {
        title: "Members & Teams",
        permissions: [
            { key: ProjectPermissionKey.VIEW_MEMBERS, label: "View Members" },
            { key: ProjectPermissionKey.MANAGE_MEMBERS, label: "Manage Members" },
            { key: ProjectPermissionKey.MANAGE_TEAMS, label: "Manage Teams" },
            { key: ProjectPermissionKey.MANAGE_PERMISSIONS, label: "Manage Permissions" },
        ],
    },
    {
        title: "Documents",
        permissions: [
            { key: ProjectPermissionKey.VIEW_DOCS, label: "View Documents" },
            { key: ProjectPermissionKey.CREATE_DOCS, label: "Create Documents" },
            { key: ProjectPermissionKey.EDIT_DOCS, label: "Edit Documents" },
            { key: ProjectPermissionKey.DELETE_DOCS, label: "Delete Documents" },
        ],
    },
];

export const ProjectPermissionsEditor = () => {
    const projectId = useProjectId();
    const workspaceId = useWorkspaceId();

    const [activeTab, setActiveTab] = useState<"roles" | "teams">("roles");
    const [selectedEntityId, setSelectedEntityId] = useState<string>("");
    const [permissions, setPermissions] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Queries
    const { data: teamsData, isLoading: isLoadingTeams } = useGetProjectTeams({ projectId });
    const { data: rolesData, isLoading: isLoadingRoles } = useGetProjectRoles({ projectId, workspaceId });

    const teams = teamsData?.documents ?? [];
    const roles = rolesData?.documents ?? [];

    // Memoize options to prevent useEffect loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const teamOptions = useMemo(() => teams, [JSON.stringify(teams)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const roleOptions = useMemo(() => roles, [JSON.stringify(roles)]);

    // Handle initial selection
    useEffect(() => {
        if (activeTab === "roles" && roleOptions.length > 0 && !selectedEntityId) {
            setSelectedEntityId(roleOptions[0].$id);
        } else if (activeTab === "teams" && teamOptions.length > 0 && !selectedEntityId) {
            setSelectedEntityId(teamOptions[0].$id);
        }
    }, [activeTab, roleOptions, teamOptions, selectedEntityId]);

    // Fetch permissions for selected entity
    // We conditionally fetch based on tab
    const { data: teamPermissionsData } = useGetProjectTeamPermissions({
        teamId: activeTab === "teams" ? selectedEntityId : ""
    });

    const activeRole = activeTab === "roles" ? roles.find(r => r.$id === selectedEntityId) : null;

    // Sync permissions state when selection changes
    useEffect(() => {
        if (activeTab === "roles" && activeRole) {
            setPermissions(activeRole.permissions || []);
            setHasChanges(false);
        } else if (activeTab === "teams" && teamPermissionsData) {
            setPermissions(teamPermissionsData);
            setHasChanges(false);
        }
    }, [activeTab, activeRole, teamPermissionsData, selectedEntityId]);

    // Mutations
    const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateProjectRole();
    const { mutate: updateTeamPermissions, isPending: isUpdatingTeam } = useUpdateProjectTeamPermissions({ teamId: selectedEntityId });

    const handleTogglePermission = (key: string) => {
        setPermissions(prev => {
            const next = prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key];
            setHasChanges(true);
            return next;
        });
    };

    const handleSave = () => {
        if (activeTab === "roles") {
            updateRole({
                roleId: selectedEntityId,
                json: { permissions }
            }, {
                onSuccess: () => setHasChanges(false)
            });
        } else {
            updateTeamPermissions({ permissions }, {
                onSuccess: () => setHasChanges(false)
            });
        }
    };

    const isUpdating = isUpdatingRole || isUpdatingTeam;

    if (isLoadingTeams || isLoadingRoles) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Permissions & Access Control</CardTitle>
                        <CardDescription>
                            Configure granular permissions for Project Roles and Teams.
                        </CardDescription>
                    </div>
                    {hasChanges && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                            <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                Unsaved changes
                            </span>
                            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <Tabs value={activeTab} onValueChange={(v) => {
                    setActiveTab(v as "roles" | "teams");
                    setSelectedEntityId("");
                }}>
                    <TabsList>
                        <TabsTrigger value="roles">Run by Role</TabsTrigger>
                        <TabsTrigger value="teams">Run by Team</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Selector Sidebar */}
                            <div className="w-full md:w-64 space-y-4">
                                <Label>
                                    Select {activeTab === "roles" ? "Role" : "Team"}
                                </Label>
                                <div className="space-y-1">
                                    {activeTab === "roles" ? (
                                        roles.map(role => (
                                            <button
                                                key={role.$id}
                                                onClick={() => setSelectedEntityId(role.$id)}
                                                disabled={false}
                                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${selectedEntityId === role.$id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                                    }`}
                                            >
                                                <span>{role.name}</span>
                                                {role.isDefault && <span className="text-[10px] opacity-70 border px-1 rounded">Default</span>}
                                            </button>
                                        ))
                                    ) : (
                                        teams.length === 0 ? (
                                            <div className="text-sm text-muted-foreground p-2">No teams found.</div>
                                        ) : (
                                            teams.map(team => (
                                                <button
                                                    key={team.$id}
                                                    onClick={() => setSelectedEntityId(team.$id)}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedEntityId === team.$id
                                                        ? "bg-primary text-primary-foreground"
                                                        : "hover:bg-muted"
                                                        }`}
                                                >
                                                    {team.name}
                                                </button>
                                            ))
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Permissions Grid */}
                            <div className="flex-1 border rounded-lg p-6 bg-card">
                                {selectedEntityId ? (
                                    <div className="grid gap-8">
                                        {PERMISSION_GROUPS.map((group) => (
                                            <div key={group.title}>
                                                <h4 className="font-medium mb-4 pb-2 border-b text-sm text-muted-foreground tracking-tight">
                                                    {group.title}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {group.permissions.map((perm) => (
                                                        <div key={perm.key} className="flex items-start gap-3">
                                                            <Checkbox
                                                                id={perm.key}
                                                                checked={permissions.includes(perm.key)}
                                                                onCheckedChange={() => handleTogglePermission(perm.key)}
                                                                disabled={activeTab === "roles" && roles.find(r => r.$id === selectedEntityId)?.name === "Owner"}
                                                            // Owner always full access, maybe lock it? Or server ignores writes.
                                                            />
                                                            <div className="grid gap-1.5 leading-none">
                                                                <Label
                                                                    htmlFor={perm.key}
                                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                >
                                                                    {perm.label}
                                                                </Label>
                                                                <p className="text-[0.8rem] text-muted-foreground">
                                                                    {/* Description can be added here if we have it */}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        Select a {activeTab === "roles" ? "role" : "team"} to configure permissions
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
