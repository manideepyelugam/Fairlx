"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Building2, Users, Settings2, Shield, Trash2, Crown,
    CreditCard, AlertTriangle, FileText, Loader2, Clock, Hash, UserPlus, Mail
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useCreateOrgMember } from "@/features/organizations/api/use-create-org-member";
import { useResendWelcomeEmail } from "@/features/organizations/api/use-resend-welcome-email";
import { BulkMemberUpload } from "@/features/organizations/components/bulk-member-upload";

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
    const { mutate: createMember, isPending: isCreatingMember } = useCreateOrgMember();
    const { mutate: resendWelcome, isPending: isResendingWelcome } = useResendWelcomeEmail();

    // Add Member modal state
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [newMemberRole, setNewMemberRole] = useState<OrganizationRole>(OrganizationRole.MEMBER);

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

    // Handler: Create new member
    const handleCreateMember = () => {
        if (!primaryOrganizationId || !newMemberName.trim() || !newMemberEmail.trim()) return;

        createMember({
            param: { orgId: primaryOrganizationId },
            json: {
                fullName: newMemberName.trim(),
                email: newMemberEmail.trim().toLowerCase(),
                role: newMemberRole,
            },
        }, {
            onSuccess: () => {
                setAddMemberOpen(false);
                setNewMemberName("");
                setNewMemberEmail("");
                setNewMemberRole(OrganizationRole.MEMBER);
            },
        });
    };

    const canDeleteOrg = isOwner && deleteConfirmName === organization?.name;

    if (!isOrg) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
                <div className="p-4 rounded-full bg-muted">
                    <Building2 className="size-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold">Organization Features</h2>
                    <p className="text-muted-foreground text-sm max-w-md">
                        Upgrade to an Organization account to unlock team collaboration,
                        advanced billing, and enterprise features.
                    </p>
                </div>
                <Button size="lg" className="gap-2">
                    <Building2 className="size-4" />
                    Upgrade to Organization
                </Button>
            </div>
        );
    }

    const isLoading = isLoadingOrg || isLoadingRole;

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">

                    <div>
                        {isLoadingOrg ? (
                            <Skeleton className="h-7 w-48 mb-1" />
                        ) : (
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {organization?.name || "Organization Settings"}
                            </h1>
                        )}
                        <p className="text-sm mt-0.5 mb-4 text-muted-foreground">
                            Manage your organization settings, members, and billing
                        </p>
                    </div>
                </div>
                <Badge variant="secondary" className="self-start text-blue-600 bg-blue-100 text-xs px-2.5 py-1">
                    <Building2 className="size-3 text-blue-600 mr-1" />
                    Organization
                </Badge>
            </div>



            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger
                        value="general"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
                    >
                        <Settings2 className="size-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger
                        value="members"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
                    >
                        <Users className="size-4 mr-2" />
                        Members
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                            {members.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
                    >
                        <Shield className="size-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger
                        value="billing"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
                    >
                        <CreditCard className="size-4 mr-2" />
                        Billing
                    </TabsTrigger>
                    <TabsTrigger
                        value="audit"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
                    >
                        <FileText className="size-4 mr-2" />
                        Audit
                    </TabsTrigger>
                </TabsList>

                {/* ==================== GENERAL TAB ==================== */}
                <TabsContent value="general" className="space-y-4 mt-6">
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Settings2 className="size-4" />
                                Organization Details
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {canEdit
                                    ? "Update your organization information"
                                    : "View your organization information"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="orgName" className="text-xs font-medium">Organization Name</Label>
                                            <Input
                                                id="orgName"
                                                value={orgName}
                                                onChange={(e) => setOrgName(e.target.value)}
                                                placeholder="Organization name"
                                                disabled={!canEdit}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="orgId" className="text-xs font-medium flex items-center gap-1.5">
                                                <Hash className="size-3" />
                                                Organization ID
                                            </Label>
                                            <Input
                                                id="orgId"
                                                value={primaryOrganizationId || ""}
                                                disabled
                                                className="font-mono text-xs h-9 bg-muted/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium flex items-center gap-1.5">
                                                <Clock className="size-3" />
                                                Created
                                            </Label>
                                            <Input
                                                value={organization?.$createdAt
                                                    ? format(new Date(organization.$createdAt), "MMMM d, yyyy")
                                                    : "-"
                                                }
                                                disabled
                                                className="h-9 bg-muted/50"
                                            />
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div className="pt-2">
                                            <Button
                                                onClick={handleSaveOrg}
                                                disabled={!hasChanges || isUpdating}
                                                size="sm"
                                            >
                                                {isUpdating && <Loader2 className="size-3.5 mr-2 animate-spin" />}
                                                Save Changes
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== MEMBERS TAB ==================== */}
                <TabsContent value="members" className="space-y-4 mt-6">
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Users className="size-4" />
                                        Organization Members
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        {members.length} member{members.length !== 1 ? "s" : ""} in your organization
                                    </CardDescription>
                                </div>
                                {canEdit && primaryOrganizationId && (
                                    <div className="flex items-center gap-2">
                                        <BulkMemberUpload organizationId={primaryOrganizationId} />
                                        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" className="gap-1.5">
                                                    <UserPlus className="size-4" />
                                                    Add Member
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2">
                                                        <UserPlus className="size-5" />
                                                        Add Organization Member
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Create a new user account and add them to your organization.
                                                        They will receive login credentials via email.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="memberName">Full Name</Label>
                                                        <Input
                                                            id="memberName"
                                                            placeholder="John Doe"
                                                            value={newMemberName}
                                                            onChange={(e) => setNewMemberName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="memberEmail">Email</Label>
                                                        <Input
                                                            id="memberEmail"
                                                            type="email"
                                                            placeholder="john@example.com"
                                                            value={newMemberEmail}
                                                            onChange={(e) => setNewMemberEmail(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="memberRole">Role</Label>
                                                        <Select
                                                            value={newMemberRole}
                                                            onValueChange={(v) => setNewMemberRole(v as OrganizationRole)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value={OrganizationRole.MEMBER}>Member</SelectItem>
                                                                <SelectItem value={OrganizationRole.MODERATOR}>Moderator</SelectItem>
                                                                <SelectItem value={OrganizationRole.ADMIN}>Admin</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Cancel</Button>
                                                    </DialogClose>
                                                    <Button
                                                        onClick={handleCreateMember}
                                                        disabled={isCreatingMember || !newMemberName.trim() || !newMemberEmail.trim()}
                                                    >
                                                        {isCreatingMember ? (
                                                            <>
                                                                <Loader2 className="size-4 animate-spin mr-2" />
                                                                Creating...
                                                            </>
                                                        ) : (
                                                            "Create Member"
                                                        )}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingMembers ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <Skeleton className="size-9 rounded-full" />
                                            <div className="flex-1 space-y-1.5">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {members.map((member: OrgMember) => (
                                        <div
                                            key={member.$id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/30 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="size-9">
                                                        <AvatarImage src={member.profileImageUrl || undefined} />
                                                        <AvatarFallback className="text-xs font-medium">
                                                            {(member.name || member.email || "?")
                                                                .split(" ")
                                                                .map(n => n[0])
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {member.role === "OWNER" && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-amber-500 border-2 border-background">
                                                            <Crown className="size-2.5 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {member.name || member.email || "Unknown"}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {member.email || member.userId}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Pending activation badge + Resend button */}
                                                {member.mustResetPassword && canEdit && primaryOrganizationId && (
                                                    <>
                                                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                                            Pending
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 gap-1 text-xs"
                                                            disabled={isResendingWelcome}
                                                            onClick={() => resendWelcome({
                                                                orgId: primaryOrganizationId,
                                                                userId: member.userId
                                                            })}
                                                        >
                                                            {isResendingWelcome ? (
                                                                <Loader2 className="size-3 animate-spin" />
                                                            ) : (
                                                                <Mail className="size-3" />
                                                            )}
                                                            Resend
                                                        </Button>
                                                    </>
                                                )}
                                                {/* Role selector (ADMIN+ can change roles) */}
                                                {canEdit ? (
                                                    <Select
                                                        value={member.role}
                                                        onValueChange={(value) =>
                                                            handleUpdateRole(member.userId, value as OrganizationRole)
                                                        }
                                                        disabled={isUpdatingRole || (member.role === "OWNER" && ownerCount === 1)}
                                                    >
                                                        <SelectTrigger className="w-24 h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="OWNER">Owner</SelectItem>
                                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                                            <SelectItem value="MODERATOR">Moderator</SelectItem>
                                                            <SelectItem value="MEMBER">Member</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${member.role === "OWNER"
                                                            ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                                            : member.role === "ADMIN"
                                                                ? "bg-purple-500/10 text-purple-700 border-purple-500/20"
                                                                : ""
                                                            }`}
                                                    >
                                                        {member.role === "OWNER" && <Crown className="size-3 mr-1" />}
                                                        {member.role === "ADMIN" && <Shield className="size-3 mr-1" />}
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
                                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                                disabled={isRemoving}
                                                            >
                                                                <Trash2 className="size-3.5" />
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
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Shield className="size-4" />
                                Security Settings
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Organization security and access settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-all">
                                <div>
                                    <div className="text-sm font-medium">Workspace Creation</div>
                                    <div className="text-xs text-muted-foreground">
                                        Who can create new workspaces in this organization
                                    </div>
                                </div>
                                <Select defaultValue="admins" disabled={!canEdit}>
                                    <SelectTrigger className="w-36 h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owners">Owners Only</SelectItem>
                                        <SelectItem value="admins">Admins & Owners</SelectItem>
                                        <SelectItem value="all">All Members</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-all">
                                <div>
                                    <div className="text-sm font-medium">Member Invitations</div>
                                    <div className="text-xs text-muted-foreground">
                                        Who can invite new members to the organization
                                    </div>
                                </div>
                                <Select defaultValue="admins" disabled={!canEdit}>
                                    <SelectTrigger className="w-36 h-8 text-xs">
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
                        <Card className="border border-destructive/30 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
                                    <AlertTriangle className="size-4" />
                                    Danger Zone
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Irreversible and destructive actions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-destructive">Delete Organization</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            Data will be retained for 30 days before permanent deletion.
                                            Billing will be frozen immediately.
                                        </div>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" size="sm" className="shrink-0 ml-4">
                                                <Trash2 className="size-3.5 mr-1.5" />
                                                Delete
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle className="text-destructive flex items-center gap-2">
                                                    <AlertTriangle className="size-5" />
                                                    Delete Organization
                                                </DialogTitle>
                                                <DialogDescription>
                                                    This action cannot be undone. This will permanently delete the
                                                    organization and all associated data after 30 days.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm">
                                                        Type <span className="font-semibold">{organization?.name}</span> to confirm:
                                                    </Label>
                                                    <Input
                                                        value={deleteConfirmName}
                                                        onChange={(e) => setDeleteConfirmName(e.target.value)}
                                                        placeholder="Organization name"
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline" size="sm">Cancel</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleDeleteOrg}
                                                    disabled={!canDeleteOrg || isDeleting}
                                                >
                                                    {isDeleting && <Loader2 className="size-3.5 mr-2 animate-spin" />}
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
