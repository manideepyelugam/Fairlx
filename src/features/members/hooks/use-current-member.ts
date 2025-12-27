import { useGetMembers } from "@/features/members/api/use-get-members";
import { useCurrent } from "@/features/auth/api/use-current";
import { MemberRole } from "@/features/members/types";

interface UseCurrentMemberProps {
  workspaceId: string;
}

export const useCurrentMember = ({ workspaceId }: UseCurrentMemberProps) => {
  const { data: user } = useCurrent();
  // Only fetch members when we have a valid workspaceId
  const hasWorkspace = Boolean(workspaceId);
  const { data: members, isLoading: isMembersLoading } = useGetMembers({
    workspaceId: workspaceId || "",
    enabled: hasWorkspace,
  });

  // If no workspace, return defaults without loading state
  if (!hasWorkspace) {
    return {
      member: null,
      isAdmin: false,
      isLoading: false
    };
  }

  if (!user || !members) {
    return {
      member: null,
      isAdmin: false,
      isLoading: isMembersLoading
    };
  }

  const member = members.documents.find(m => m.userId === user.$id);
  const isAdmin = member?.role === MemberRole.ADMIN;

  return {
    member,
    isAdmin,
    isLoading: false
  };
};

