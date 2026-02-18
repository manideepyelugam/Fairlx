import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    CalendarIcon,
    ExternalLink,
    PlusIcon,
    ListTodo,
    FolderKanban,
    Users,
    SettingsIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateWorkItemModal } from "@/features/sprints/hooks/use-create-work-item-modal";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import type { PopulatedWorkItem } from "@/features/sprints/types";
import type { Project } from "@/features/projects/types";
import type { Member } from "@/features/members/types";

interface WorkItemListProps {
    data: PopulatedWorkItem[]
    total: number
}

export const WorkItemList = ({ data, total }: WorkItemListProps) => {
    const workspaceId = useWorkspaceId()
    const { open: createWorkItem } = useCreateWorkItemModal()
    const { isAdmin } = useCurrentMember({ workspaceId })

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-medium text-muted-foreground">Work Items ({total})</h3>
                </div>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => createWorkItem()}
                        className="h-6 w-6"
                    >
                        <PlusIcon className="size-3" />
                    </Button>
                )}
            </div>
            <div className="space-y-2">
                {data.slice(0, 5).map((item) => (
                    <Link
                        key={item.$id}
                        href={`/workspaces/${workspaceId}/projects/${item.projectId}/backlog?workItemId=${item.$id}`}
                        className="flex items-center justify-between p-2 bg-secondary/10 rounded-md hover:bg-secondary/20 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                                <span className="truncate">{item.key || "Task"}</span>
                                {item.dueDate && (
                                    <>
                                        <span>•</span>
                                        <CalendarIcon className="size-2.5" />
                                        <span>{formatDistanceToNow(new Date(item.dueDate))}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
                {data.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No work items</p>
                )}
            </div>
            {data.length > 5 && (
                <Link href={`/workspaces/${workspaceId}/tasks`}>
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs gap-1">
                        View All <ExternalLink className="size-3" />
                    </Button>
                </Link>
            )}
        </Card>
    )
}

interface ProjectListProps {
    data: Project[]
    total: number
}

export const ProjectList = ({ data, total }: ProjectListProps) => {
    const workspaceId = useWorkspaceId()
    const { open: createProject } = useCreateProjectModal()
    const { isAdmin } = useCurrentMember({ workspaceId })

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-medium text-muted-foreground">Projects ({total})</h3>
                </div>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => createProject()}
                        className="h-6 w-6"
                    >
                        <PlusIcon className="size-3" />
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {data.slice(0, 4).map((project) => (
                    <Link
                        key={project.$id}
                        href={`/workspaces/${workspaceId}/projects/${project.$id}`}
                        className="flex flex-col items-center gap-2 p-3 bg-secondary/10 rounded-md hover:bg-secondary/20 transition-colors"
                    >
                        <ProjectAvatar
                            name={project.name}
                            image={project.imageUrl}
                            className="size-8"
                            fallbackClassName="text-xs"
                        />
                        <p className="text-xs font-medium text-center truncate w-full">{project.name}</p>
                    </Link>
                ))}
                {data.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 col-span-2">No projects</p>
                )}
            </div>
            {data.length > 4 && (
                <Link href={`/workspaces/${workspaceId}/projects`}>
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs gap-1">
                        View All <ExternalLink className="size-3" />
                    </Button>
                </Link>
            )}
        </Card>
    )
}

interface MemberListProps {
    data: Member[]
    total: number
}

export const MemberList = ({ data, total }: MemberListProps) => {
    const workspaceId = useWorkspaceId()

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-medium text-muted-foreground">Members ({total})</h3>
                </div>
                <Link href={`/workspaces/${workspaceId}/members`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <SettingsIcon className="size-3" />
                    </Button>
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {data.slice(0, 4).map((member) => {
                    const displayName = member.name?.trim() || member.email || "Unknown"
                    return (
                        <div
                            key={member.$id}
                            className="flex flex-col items-center gap-2 p-3 bg-secondary/10 rounded-md"
                        >
                            <MemberAvatar
                                name={displayName}
                                className="size-8"
                                imageUrl={member.profileImageUrl}
                            />
                            <div className="text-center w-full overflow-hidden">
                                <p className="text-xs font-medium truncate">{displayName}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{member.role}</p>
                            </div>
                        </div>
                    )
                })}
                {data.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 col-span-2">No members</p>
                )}
            </div>
            {data.length > 4 && (
                <Link href={`/workspaces/${workspaceId}/members`}>
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs gap-1">
                        View All <ExternalLink className="size-3" />
                    </Button>
                </Link>
            )}
        </Card>
    )
}
