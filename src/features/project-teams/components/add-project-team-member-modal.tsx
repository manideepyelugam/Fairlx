"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAddProjectTeamMember } from "../api/use-add-project-team-member";
import { useGetProjectMembers } from "@/features/project-members/api/use-get-project-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
    userId: z.string().min(1, "Please select a member"),
    teamRole: z.string().max(50).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProjectTeamMemberModalProps {
    projectId: string;
    teamId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddProjectTeamMemberModal({
    projectId,
    teamId,
    open,
    onOpenChange,
}: AddProjectTeamMemberModalProps) {
    const workspaceId = useWorkspaceId();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserName, setSelectedUserName] = useState("");

    const { mutate: addMember, isPending } = useAddProjectTeamMember({ projectId });

    // Fetch actual project members
    const { data: membersData, isLoading: isLoadingMembers } = useGetProjectMembers({
        projectId,
        workspaceId
    });
    
    // Fetch workspace members to identify admins
    const { data: workspaceMembersData } = useGetMembers({ workspaceId });
    
    // Create a set of admin userIds (ADMIN/OWNER roles cannot be added to teams)
    const adminUserIds = new Set(
        (workspaceMembersData?.documents || [])
            .filter((m) => m.role === "ADMIN" || m.role === "OWNER")
            .map((m) => m.userId)
    );

    // Transform project members to display format, filtering out workspace admins
    // Admins already have all permissions and don't need to be in teams
    const availableMembers = (membersData?.documents || [])
        .filter((member) => !adminUserIds.has(member.userId)) // Filter out admins
        .map((member) => ({
            $id: member.$id,
            userId: member.userId,
            name: member.user?.name || "Unknown",
            email: member.user?.email || "",
            profileImageUrl: member.user?.profileImageUrl,
        }));

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: "",
            teamRole: "",
        },
    });

    const filteredMembers = availableMembers.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectMember = (member: typeof availableMembers[0]) => {
        setSelectedUserId(member.userId);
        setSelectedUserName(member.name);
        form.setValue("userId", member.userId);
    };

    const onSubmit = (values: FormValues) => {
        addMember(
            {
                projectId,
                teamId,
                userId: values.userId,
                teamRole: values.teamRole || undefined,
            },
            {
                onSuccess: () => {
                    form.reset();
                    setSelectedUserId(null);
                    setSelectedUserName("");
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Add Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Add a project member to this team. Only project members can join teams.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search project members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Members List */}
                        <FormField
                            control={form.control}
                            name="userId"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Select Member</FormLabel>
                                    <FormControl>
                                        <ScrollArea className="h-[200px] rounded-md border p-2">
                                            {isLoadingMembers ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                </div>
                                            ) : filteredMembers.length === 0 ? (
                                                <div className="text-center py-8 text-sm text-muted-foreground">
                                                    {availableMembers.length === 0
                                                        ? "No project members available"
                                                        : "No matching members found"}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {filteredMembers.map((member) => (
                                                        <button
                                                            key={member.userId}
                                                            type="button"
                                                            onClick={() => handleSelectMember(member)}
                                                            className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${selectedUserId === member.userId
                                                                ? "bg-primary text-primary-foreground"
                                                                : "hover:bg-muted"
                                                                }`}
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={member.profileImageUrl} />
                                                                <AvatarFallback>
                                                                    {member.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium">{member.name}</p>
                                                                <p className="text-xs opacity-70">{member.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Selected indicator */}
                        {selectedUserName && (
                            <p className="text-sm text-muted-foreground">
                                Selected: <strong>{selectedUserName}</strong>
                            </p>
                        )}

                        {/* Team Role */}
                        <FormField
                            control={form.control}
                            name="teamRole"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Team Role (optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Lead, Reviewer, Designer"
                                            {...field}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending || !selectedUserId}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add to Team
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
