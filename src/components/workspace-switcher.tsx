"use client";

import { RiAddCircleFill } from "react-icons/ri";
import { LogOut, Plus } from "lucide-react";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateWorkspaceModal } from "@/features/workspaces/hooks/use-create-workspace-modal";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useConfirm } from "@/hooks/use-confirm";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const WorkspaceSwitcher = () => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { data: workspaces } = useGetWorkspaces();
  const { open } = useCreateWorkspaceModal();
  const { member } = useCurrentMember({ workspaceId });
  const { mutate: deleteMember } = useDeleteMember();
  
  const [ConfirmDialog, confirm] = useConfirm(
    "Leave Workspace",
    "Are you sure you want to leave this workspace? You will need an invite to rejoin.",
    "destructive"
  );

  const onSelect = (id: string) => {
    router.push(`/workspaces/${id}`);
  };

  const handleLeaveWorkspace = async () => {
    if (!member) return;
    
    const ok = await confirm();
    if (!ok) return;

    deleteMember(
      { param: { memberId: member.$id } },
      {
        onSuccess: () => {
          window.location.href = "/";
        },
      }
    );
  };

  return (
    <div className="flex flex-col px-3 pt-5 pb-8   border-t-[1.5px] border-neutral-200">
      <ConfirmDialog />
      <div className="flex items-center justify-between pb-4 ">
        <p className="text-[13px] tracking-normal font-medium  pl-2 text-primary">Workspaces</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-5 p-0 hover:bg-transparent">
              <RiAddCircleFill className="size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={open} className="cursor-pointer">
              <Plus className="size-4 mr-2" />
              Create Workspace
            </DropdownMenuItem>
            {member && workspaces && workspaces.documents.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLeaveWorkspace} 
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4 mr-2" />
                  Leave Workspace
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Select onValueChange={onSelect} value={workspaceId}>

        <SelectTrigger className="w-full  font-medium text-sm ">
          <SelectValue placeholder="No workspace selected." />
        </SelectTrigger>

        <SelectContent>
          {workspaces?.documents.map((workspace) => (
            <SelectItem key={workspace.$id} value={workspace.$id}>
              <div className="flex justify-start items-center gap-3 font-medium">
                <WorkspaceAvatar
                  name={workspace.name}
                  image={workspace.imageUrl}
                />
                <span className="truncate">{workspace.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
