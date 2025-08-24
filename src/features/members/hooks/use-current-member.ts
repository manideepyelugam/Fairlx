import { useGetMembers } from "@/features/members/api/use-get-members";
import { useCurrent } from "@/features/auth/api/use-current";
import { MemberRole } from "@/features/members/types";

interface UseCurrentMemberProps {
  workspaceId: string;
}

export const useCurrentMember = ({ workspaceId }: UseCurrentMemberProps) => {
  const { data: user } = useCurrent();
  const { data: members } = useGetMembers({ workspaceId });

  if (!user || !members) {
    return { 
      member: null, 
      isAdmin: false, 
      isLoading: true 
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
