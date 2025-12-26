"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Building2, Users, Settings2, Shield, Trash2, Crown,
    CreditCard, AlertTriangle, FileText, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useAccountType } from "@/features/organizations/hooks/use-account-type";
import { useGetOrganization } from "@/features/organizations/api/use-get-organization";
import { useUpdateOrganization } from "@/features/organizations/api/use-update-organization";
import { useGetOrgMembers, OrgMember } from "@/features/organizations/api/use-get-org-members";
import { useUpdateOrgMemberRole } from "@/features/organizations/api/use-update-org-member-role";
import { useRemoveOrgMember } from "@/features/organizations/api/use-remove-org-member";
import { useDeleteOrganization } from "@/features/organizations/api/use-delete-organization";
import { useCurrentOrgMember } from "@/features/organizations/api/use-current-org-member";
import { OrganizationRole } from "@/features/organizations/types";
import { OrganizationBillingSettings } from "@/features/organizations/components/organization-billing-settings";
import { OrganizationAuditLogs } from "@/features/organizations/components/organization-audit-logs";

export const OrganizationSettingsClient = () => {
    const { isOrg, primaryOrganizationId } = useAccountType();
    const [activeTab, setActiveTab] = useState("general");

    // Fetch organization data
    const {
        data: organization,
        isLoading: isLoadingOrg
    } = useGetOrganization({ orgId: primaryOrganizationId || "" });

    // Fetch members
    const {
        data: membersData,
        isLoading: isLoadingMembers
    } = useGetOrgMembers({ organizationId: primaryOrganizationId || "" });

    // Current user's role
    const { canEdit, isOwner, isLoading: isLoadingRole } = useCurrentOrgMember({
        organizationId: primaryOrganizationId || ""
    });

    // General settings form state
    const [orgName, setOrgName] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    // Delete confirmation state
    const [deleteConfirmName, setDeleteConfirmName] = useState("");

    // Mutations
    const { mutate: updateOrg, isPending: isUpdating } = useUpdateOrganization();
    const { mutate: updateMemberRole, isPending: isUpdatingRole } = useUpdateOrgMemberRole();
    const { mutate: removeMember, isPending: isRemoving } = useRemoveOrgMember();
    const { mutate: deleteOrg, isPending: isDeleting } = useDeleteOrganization();

    // Sync form state with fetched data
    useEffect(() => {
        if (organization?.name) {
            setOrgName(organization.name);
        }
    }, [organization?.name]);

    // Detect changes
    useEffect(() => {
        if (organization?.name) {
            setHasChanges(orgName !== organization.name);
        }
    }, [orgName, organization?.name]);

    const members = membersData?.documents || [];
    const ownerCount = members.filter((m: OrgMember) => m.role === "OWNER").length;

    // Handler: Save organization changes
    const handleSaveOrg = () => {
        if (!primaryOrganizationId || !hasChanges) return;
        updateOrg({
            organizationId: primaryOrganizationId,
            name: orgName,
        });
    };

    // Handler: Update member role
    const handleUpdateRole = (userId: string, newRole: OrganizationRole) => {
        if (!primaryOrganizationId) return;
        updateMemberRole({
            organizationId: primaryOrganizationId,
            userId,
            role: newRole,
        });
    };

    // Handler: Remove member
    const handleRemoveMember = (userId: string) => {
        if (!primaryOrganizationId) return;
        removeMember({
            organizationId: primaryOrganizationId,
            userId,
        });
    };

    // Handler: Delete organization
    const handleDeleteOrg = () => {
        if (!primaryOrganizationId) return;
        deleteOrg({ organizationId: primaryOrganizationId });
    };

    const canDeleteOrg = isOwner && deleteConfirmName === organization?.name;

    if (!isOrg) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                <Building2 className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Organization Features</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Upgrade to an Organization account to access these features.
                </p>
                <Button>Upgrade to Organization</Button>
            </div>
        );
    }

    const isLoading = isLoadingOrg || isLoadingRole;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                        {isLoadingOrg ? (
                            <Skeleton className="h-8 w-48" />
                        ) : (
                            <h1 className="text-2xl font-bold">
                                {organization?.name || "Organization Settings"}
                            </h1>
                        )}
                        <p className="text-muted-foreground">
                            Manage your organization settings, members, and billing
                        </p>
                    </div>
                </div>
                <Badge variant="default">Organization</Badge>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">
                        <Settings2 className="h-4 w-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="members">
                        <Users className="h-4 w-4 mr-2" />
                        Members
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="billing">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                    </TabsTrigger>
                    <TabsTrigger value="audit">
                        <FileText className="h-4 w-4 mr-2" />
                        Audit
                    </TabsTrigger>
                </TabsList>

                {/* ==================== GENERAL TAB ==================== */}
                <TabsContent value="general" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Organization Details
                            </CardTitle>
                            <CardDescription>
                                {canEdit
                                    ? "Update your organization information"
                                    : "View your organization information"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="orgName">Organization Name</Label>
                                            <Input
                                                id="orgName"
                                                value={orgName}
                                                onChange={(e) => setOrgName(e.target.value)}
                                                placeholder="Organization name"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="orgId">Organization ID</Label>
                                            <Input
                                                id="orgId"
                                                value={primaryOrganizationId || ""}
                                                disabled
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Created</Label>
                                            <Input
                                                value={organization?.$createdAt
                                                    ? format(new Date(organization.$createdAt), "MMM d, yyyy")
                                                    : "-"
                                                }
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <Button
                                            onClick={handleSaveOrg}
                                            disabled={!hasChanges || isUpdating}
                                        >
                                            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== MEMBERS TAB ==================== */}
                <TabsContent value="members" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Organization Members
                                    </CardTitle>
                                    <CardDescription>
                                        {members.length} member{members.length !== 1 ? "s" : ""} in your organization
                                    </CardDescription>
                                </div>
                                {/* Note: Invite functionality requires email-based invitation system */}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingMembers ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {members.map((member: OrgMember) => (
                                        <div
                                            key={member.$id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={member.profileImageUrl || undefined} />
                                                    <AvatarFallback>
                                                        {(member.name || member.email || "?")
                                                            .split(" ")
                                                            .map(n => n[0])
                                                            .join("")
                                                            .toUpperCase()
                                                            .slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {member.name || member.email || "Unknown"}
                                                        </span>
                                                        {member.role === "OWNER" && (
                                                            <Crown className="h-4 w-4 text-yellow-500" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {member.email || member.userId}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Role selector (ADMIN+ can change roles) */}
                                                {canEdit ? (
                                                    <Select
                                                        value={member.role}
                                                        onValueChange={(value) =>
                                                            handleUpdateRole(member.userId, value as OrganizationRole)
                                                        }
                                                        disabled={isUpdatingRole || (member.role === "OWNER" && ownerCount === 1)}
                                                    >
                                                        <SelectTrigger className="w-28">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="OWNER">Owner</SelectItem>
                                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                                            <SelectItem value="MEMBER">Member</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge variant={
                                                        member.role === "OWNER" ? "default" :
                                                            member.role === "ADMIN" ? "secondary" : "outline"
                                                    }>
                                                        {member.role}
                                                    </Badge>
                                                )}

                                                {/* Remove member (ADMIN+ can remove, but not last OWNER) */}
                                                {canEdit && member.role !== "OWNER" && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive"
                                                                disabled={isRemoving}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will remove {member.name || member.email} from the organization.
                                                                    They will lose access to all organization resources.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRemoveMember(member.userId)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Remove
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== SECURITY TAB (with Danger Zone) ==================== */}
                <TabsContent value="security" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security
                            </CardTitle>
                            <CardDescription>
                                Organization security and access settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                    <div className="font-medium">Workspace Creation</div>
                                    <div className="text-sm text-muted-foreground">
                                        Who can create new workspaces in this organization
                                    </div>
                                </div>
                                <Select defaultValue="admins" disabled={!canEdit}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owners">Owners Only</SelectItem>
                                        <SelectItem value="admins">Admins & Owners</SelectItem>
                                        <SelectItem value="all">All Members</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                    <div className="font-medium">Member Invitations</div>
                                    <div className="text-sm text-muted-foreground">
                                        Who can invite new members to the organization
                                    </div>
                                </div>
                                <Select defaultValue="admins" disabled={!canEdit}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owners">Owners Only</SelectItem>
                                        <SelectItem value="admins">Admins & Owners</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone - OWNER ONLY */}
                    {isOwner && (
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Danger Zone
                                </CardTitle>
                                <CardDescription>
                                    Irreversible and destructive actions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                                    <div>
                                        <div className="font-medium">Delete Organization</div>
                                        <div className="text-sm text-muted-foreground">
                                            Data will be retained for 30 days before permanent deletion.
                                            Billing will be frozen immediately.
                                        </div>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle className="text-destructive">
                                                    Delete Organization
                                                </DialogTitle>
                                                <DialogDescription>
                                                    This action cannot be undone. This will permanently delete the
                                                    organization and all associated data after 30 days.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>
                                                        Type <strong>{organization?.name}</strong> to confirm:
                                                    </Label>
                                                    <Input
                                                        value={deleteConfirmName}
                                                        onChange={(e) => setDeleteConfirmName(e.target.value)}
                                                        placeholder="Organization name"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeleteOrg}
                                                    disabled={!canDeleteOrg || isDeleting}
                                                >
                                                    {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                    Delete Organization
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ==================== BILLING TAB ==================== */}
                <TabsContent value="billing" className="space-y-4 mt-6">
                    <OrganizationBillingSettings
                        organizationId={primaryOrganizationId || ""}
                        organizationName={organization?.name || "Organization"}
                    />
                </TabsContent>

                {/* ==================== AUDIT TAB (OWNER ONLY) ==================== */}
                <TabsContent value="audit" className="space-y-4 mt-6">
                    {primaryOrganizationId && (
                        <OrganizationAuditLogs organizationId={primaryOrganizationId} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
