"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Building2, Users, Settings2, Shield, Plus, Trash2, UserPlus, Crown, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import { useAccountType } from "@/features/organizations/hooks/use-account-type";
import { useGetOrganizations } from "@/features/organizations/api/use-get-organizations";
import { OrganizationRole } from "@/features/organizations/types";
import { OrganizationBillingSettings } from "@/features/organizations/components/organization-billing-settings";

export const OrganizationSettingsClient = () => {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const { isOrg, primaryOrganizationId } = useAccountType();
    const { data: organizations } = useGetOrganizations();
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState(OrganizationRole.MEMBER);
    const [activeTab, setActiveTab] = useState("general");

    // Get current org
    const currentOrg = isOrg && primaryOrganizationId
        ? organizations?.documents?.find((o: { $id: string }) => o.$id === primaryOrganizationId)
        : null;

    // Mock members data - in real implementation, fetch from API
    const members = [
        { id: "1", name: "John Doe", email: "john@example.com", role: "OWNER", avatar: null },
        { id: "2", name: "Jane Smith", email: "jane@example.com", role: "ADMIN", avatar: null },
        { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "MEMBER", avatar: null },
    ];

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

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">
                            {(currentOrg as { name?: string })?.name || "Organization Settings"}
                        </h1>
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
                <TabsList className="grid w-full grid-cols-4">
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
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-4 mt-6">

                    {/* Organization Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Organization Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <Input
                                        id="orgName"
                                        defaultValue={(currentOrg as { name?: string })?.name || ""}
                                        placeholder="Organization name"
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
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-4 mt-6">
                    {/* Members Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Organization Members
                                    </CardTitle>
                                    <CardDescription>
                                        Manage who has access to your organization
                                    </CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Invite Member
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Invite Member</DialogTitle>
                                            <DialogDescription>
                                                Add a new member to your organization
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    placeholder="member@example.com"
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="role">Role</Label>
                                                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrganizationRole)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={OrganizationRole.MEMBER}>Member</SelectItem>
                                                        <SelectItem value={OrganizationRole.ADMIN}>Admin</SelectItem>
                                                        <SelectItem value={OrganizationRole.OWNER}>Owner</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Send Invite</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 rounded-lg border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={member.avatar || undefined} />
                                                <AvatarFallback>
                                                    {member.name.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{member.name}</span>
                                                    {member.role === "OWNER" && (
                                                        <Crown className="h-4 w-4 text-yellow-500" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-muted-foreground">{member.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                member.role === "OWNER" ? "default" :
                                                    member.role === "ADMIN" ? "secondary" : "outline"
                                            }>
                                                {member.role}
                                            </Badge>
                                            {member.role !== "OWNER" && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4 mt-6">
                    {/* Security & Permissions */}
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
                                <Select defaultValue="admins">
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
                                <Select defaultValue="admins">
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

                    {/* Danger Zone */}
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>
                                Irreversible actions for your organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                                <div>
                                    <div className="font-medium">Delete Organization</div>
                                    <div className="text-sm text-muted-foreground">
                                        Permanently delete this organization and all its data
                                    </div>
                                </div>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="space-y-4 mt-6">
                    <OrganizationBillingSettings
                        organizationId={primaryOrganizationId || ""}
                        organizationName={(currentOrg as { name?: string })?.name || "Organization"}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};
