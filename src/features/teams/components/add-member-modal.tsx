"use client";

import { useState } from "react";
import { UserPlus, Check, Search } from "lucide-react";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAddTeamMember } from "../api/use-add-team-member";
import { TeamMemberRole, TeamMemberAvailability } from "../types";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTeamMembers } from "../api/use-get-team-members";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export const AddMemberModal = ({ open, onOpenChange, teamId }: AddMemberModalProps) => {
  const workspaceId = useWorkspaceId();
  const { data: workspaceMembers, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });
  const { data: teamMembersData } = useGetTeamMembers({ teamId });
  const { mutate: addMember, isPending } = useAddTeamMember();
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const allMembers = workspaceMembers?.documents || [];
  const teamMembers = teamMembersData?.documents || [];
  const teamMemberIds = new Set(teamMembers.map(m => m.memberId));

  // Filter out members already in the team
  const availableMembers = allMembers.filter(member => !teamMemberIds.has(member.$id));

  // Filter by search query
  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddMembers = () => {
    if (selectedMembers.length === 0) return;

    // Add members one by one
    let completed = 0;
    selectedMembers.forEach((memberId) => {
      addMember(
        {
          param: { teamId },
          json: {
            teamId,
            memberId,
            role: TeamMemberRole.MEMBER,
            availability: TeamMemberAvailability.FULL_TIME,
          },
        },
        {
          onSettled: () => {
            completed++;
            if (completed === selectedMembers.length) {
              setSelectedMembers([]);
              setSearchQuery("");
              onOpenChange(false);
            }
          },
        }
      );
    });
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleClose}>
      <div className="flex flex-col h-[500px]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-primary/10">
              <UserPlus className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Add Team Members</h2>
              <p className="text-xs text-muted-foreground">Select members to add to this team</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {/* Member List */}
        <ScrollArea className="flex-1 px-4">
          {isLoadingMembers ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading members...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium">No members found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try a different search" : "All workspace members are already in this team"}
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.includes(member.$id);
                return (
                  <div
                    key={member.$id}
                    onClick={() => toggleMember(member.$id)}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMember(member.$id)}
                      className="shrink-0"
                    />
                    <Avatar className="size-8 shrink-0">
                      {member.profileImageUrl ? (
                        <AvatarImage src={member.profileImageUrl} alt={member.name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {isSelected && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-muted/20">
          {selectedMembers.length > 0 && (
            <div className="mb-2">
              <Badge variant="secondary" className="text-xs">
                {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMembers} 
              disabled={isPending || selectedMembers.length === 0}
              size="sm"
            >
              Add {selectedMembers.length > 0 && `(${selectedMembers.length})`}
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};
