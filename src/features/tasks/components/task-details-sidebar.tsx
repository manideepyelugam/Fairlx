"use client";

import { useState } from "react";
import {
  CircleDotDashedIcon,
  ChevronDown,
  ChevronRight,
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  Minus,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Tag,
  Users,
  Check,
  X,
  Send,
  Plus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { Member } from "@/features/members/types";
// import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useUpdateTask } from "../api/use-update-task";
import { PopulatedTask, TaskStatus, TaskPriority } from "../types";
import { toast } from "sonner";

interface TaskDetailsSidebarProps {
  task: PopulatedTask;
  workspaceId: string;
  canEdit?: boolean;
}

// Status configuration
const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  [TaskStatus.TODO]: {
    icon: <CircleIcon className="size-4" />,
    label: "Todo",
    color: "text-gray-400",
  },
  [TaskStatus.ASSIGNED]: {
    icon: <CircleIcon className="size-4" />,
    label: "Backlog",
    color: "text-gray-400",
  },
  [TaskStatus.IN_PROGRESS]: {
    icon: <CircleDotDashedIcon className="size-4" />,
    label: "In Progress",
    color: "text-yellow-500",
  },
  [TaskStatus.IN_REVIEW]: {
    icon: <CircleDotIcon className="size-4" />,
    label: "In Review",
    color: "text-blue-500",
  },
  [TaskStatus.DONE]: {
    icon: <CircleCheckIcon className="size-4" />,
    label: "Done",
    color: "text-green-500",
  },
};

// Extended status list for the popover
const allStatuses = [
  { value: "BACKLOG", icon: <CircleDotDashedIcon className="size-4 text-gray-400" />, label: "Backlog", key: "1" },
  { value: TaskStatus.TODO, icon: <CircleIcon className="size-4 text-gray-400" />, label: "Todo", key: "2" },
  { value: TaskStatus.IN_PROGRESS, icon: <CircleDotDashedIcon className="size-4 text-yellow-500" />, label: "In Progress", key: "3" },
  { value: TaskStatus.DONE, icon: <CircleCheckIcon className="size-4 text-green-500" />, label: "Done", key: "4" },
  { value: "CANCELED", icon: <X className="size-4 text-gray-500" />, label: "Canceled", key: "5" },
  { value: "DUPLICATE", icon: <X className="size-4 text-gray-500" />, label: "Duplicate", key: "6" },
];

// Priority configuration
const priorityConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  [TaskPriority.URGENT]: {
    icon: <AlertTriangle className="size-4" />,
    label: "Urgent",
    color: "text-red-500",
  },
  [TaskPriority.HIGH]: {
    icon: <ArrowUp className="size-4" />,
    label: "High",
    color: "text-orange-500",
  },
  [TaskPriority.MEDIUM]: {
    icon: <Minus className="size-4" />,
    label: "Medium",
    color: "text-yellow-500",
  },
  [TaskPriority.LOW]: {
    icon: <ArrowDown className="size-4" />,
    label: "Low",
    color: "text-blue-500",
  },
};

const allPriorities = [
  { value: "", icon: <Minus className="size-4 text-gray-400" />, label: "No priority", key: "0" },
  { value: TaskPriority.URGENT, icon: <AlertTriangle className="size-4 text-red-500" />, label: "Urgent", key: "1" },
  { value: TaskPriority.HIGH, icon: <ArrowUp className="size-4 text-orange-500" />, label: "High", key: "2" },
  { value: TaskPriority.MEDIUM, icon: <Minus className="size-4 text-yellow-500" />, label: "Medium", key: "3" },
  { value: TaskPriority.LOW, icon: <ArrowDown className="size-4 text-blue-500" />, label: "Low", key: "4" },
];

// Label colors
const labelColors: Record<string, string> = {
  Bug: "bg-red-500",
  Feature: "bg-purple-500",
  Improvement: "bg-blue-500",
  Documentation: "bg-green-500",
  Design: "bg-pink-500",
};

const suggestedLabels = ["Bug", "Feature", "Improvement"];
const allLabels = ["Feature", "Improvement", "Documentation", "Design"];

export const TaskDetailsSidebar = ({
  task,
  workspaceId,
  canEdit = true,
}: TaskDetailsSidebarProps) => {
  const { data: members } = useGetMembers({ workspaceId });
  const { mutate: updateTask } = useUpdateTask();

  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(true);
  const [labelOpen, setLabelOpen] = useState(true);


  const [statusSearch, setStatusSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [labelSearch, setLabelSearch] = useState("");

  const handleUpdateTask = (updates: Record<string, string | string[] | null | undefined>) => {
    updateTask(
      { param: { taskId: task.$id }, json: updates },
      {
        onError: () => {
          toast.error("Failed to update task");
        },
      }
    );
  };

  const handleStatusChange = (status: string) => {
    handleUpdateTask({ status });
    setStatusOpen(false);
  };

  const handlePriorityChange = (priority: string) => {
    handleUpdateTask({ priority: priority || undefined });
    setPriorityOpen(false);
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const assigneeIds = assigneeId === "__none" ? [] : [assigneeId];
    handleUpdateTask({ assigneeIds });
    setAssigneeOpen(false);
  };

  const handleAddLabel = (label: string) => {
    const currentLabels = task.labels || [];
    if (!currentLabels.includes(label)) {
      handleUpdateTask({ labels: [...currentLabels, label] });
    }
    setLabelsOpen(false);
  };


  // Get current status display
  const currentStatus = statusConfig[task.status] || {
    icon: <CircleDotDashedIcon className="size-4 text-gray-400" />,
    label: "Backlog",
    color: "text-gray-400",
  };

  // Get current priority display
  const currentPriority = task.priority
    ? priorityConfig[task.priority]
    : null;

  // Get current assignee
  const currentAssignee =
    task.assignees && task.assignees.length > 0
      ? task.assignees[0]
      : task.assignee;

  // Filter functions
  const filteredStatuses = allStatuses.filter((s) =>
    s.label.toLowerCase().includes(statusSearch.toLowerCase())
  );

  const filteredMembers = members?.documents?.filter((m: Member) =>
    m.name?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const filteredLabels = [...suggestedLabels, ...allLabels].filter(
    (l) =>
      l.toLowerCase().includes(labelSearch.toLowerCase()) &&
      !(task.labels || []).includes(l)
  );

  return (
    <div className="flex flex-col gap-1  py-2">
      <div className="mt-2 mb-1 px-2">
         <div onClick={() => setProjectOpen(!projectOpen)} className="flex gap-1 cursor-pointer items-center flex-row">
              {projectOpen ? (
                         <ChevronDown className="size-3 text-gray-500" />
                       ) : (
                         <ChevronRight className="size-3 text-gray-500" />
                       )}

               <span className="text-xs text-gray-500 ">Status</span>

         </div>

      {projectOpen ? (
        <>
         <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild disabled={!canEdit}>
          <button className="flex items-center gap-3 mt-2 px-2 py-2 hover:bg-gray-100 rounded-md w-full text-left">
            <span className={cn("flex items-center", currentStatus.color)}>
              {currentStatus.icon}
            </span>
            <span className="text-[13px] font-normal ">{currentStatus.label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-white border border-gray-200 text-gray-900 shadow-lg" align="start" side="left" sideOffset={8}>
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 border-b border-gray-200 mb-1">
              <Input
                placeholder="Change status..."
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
                className="h-7 border-0 focus-visible:ring-0 p-0 text-xs bg-transparent text-gray-900 placeholder:text-gray-400"
              />
              
            </div>
            <div className="space-y-0.5">
              {filteredStatuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-gray-100 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    {status.icon}
                    <span className="text-xs tracking-normal">{status.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === status.value && <Check className="size-4 text-gray-600" />}
                    <span className="text-xs text-gray-400">{status.key}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    
      <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
        <PopoverTrigger asChild disabled={!canEdit}>
          <button className="flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded-md w-full text-left">
            {currentPriority ? (
              <>
                <span className={cn("flex items-center", currentPriority.color)}>
                  {currentPriority.icon}
                </span>
                <span className="text-[13px] font-normal ">{currentPriority.label}</span>
              </>
            ) : (
              <>
                <Minus className="size-4 text-gray-400" />
                <span className="text-sm text-gray-500">Set priority</span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-white border border-gray-200 text-gray-900 shadow-lg" align="start" side="left" sideOffset={8}>
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 mb-1">
              <span className="text-xs text-gray-500">Set priority to...</span>
            </div>
            <div className="space-y-0.5">
              {allPriorities.map((priority) => (
                <button
                  key={priority.value || "none"}
                  onClick={() => handlePriorityChange(priority.value)}
                  className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-gray-100 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    {priority.icon}
                    <span className="text-xs tracking-normal">{priority.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.priority === priority.value && <Check className="size-4 text-gray-600" />}
                    <span className="text-xs text-gray-400">{priority.key}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
        <PopoverTrigger asChild disabled={!canEdit}>
          <button className="flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded-md w-full text-left">
            {currentAssignee ? (
              <>
                <MemberAvatar
                  name={currentAssignee.name || ""}
                  imageUrl={currentAssignee.profileImageUrl}
                  className="size-5"
                />
                <span className="text-[13px] font-normal ">{currentAssignee.name}</span>
              </>
            ) : (
              <>
                <Users className="size-4 text-gray-400" />
                <span className="text-[13px] font-normal text-gray-500">Assign to...</span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-white border-gray-200 text-gray-900 shadow-lg" align="start" side="left" sideOffset={8}>
          <div className="p-2">
            <div className="flex items-center gap-2 px-2  border-gray-200 mb-4">
              <Input
                placeholder="Assign to..."
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                className="h-7 border-0 focus-visible:ring-0 p-0 text-xs bg-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {/* No assignee option */}
              <button
                onClick={() => handleAssigneeChange("__none")}
                className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-gray-100 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-gray-400" />
                  <span className="text-xs tracking-normal">No assignee</span>
                </div>
                <div className="flex items-center gap-2">
                  {!currentAssignee && <Check className="size-4 text-gray-600" />}
                  <span className="text-xs text-gray-400">0</span>
                </div>
              </button>

              {/* Members list */}
              {filteredMembers?.map((member: Member, index: number) => (
                <button
                  key={member.$id}
                  onClick={() => handleAssigneeChange(member.$id)}
                  className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-gray-100 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <MemberAvatar
                      name={member.name || "Unknown"}
                      imageUrl={member.profileImageUrl}
                      className="size-5"
                    />
                    <span className="text-xs tracking-normal">{member.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentAssignee?.$id === member.$id && <Check className="size-4 text-gray-600" />}
                    <span className="text-xs text-gray-400">{index + 1}</span>
                  </div>
                </button>
              ))}

              {/* Team members section header */}
              {members && members.documents && members.documents.length > 0 && (
                <div className="px-2 py-1 text-xs text-gray-500 font-medium mt-2">
                  Team members
                </div>
              )}

              {/* Invite option */}
              <button className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-gray-500">
                <Send className="size-4" />
                <span className="text-xs">Invite and assign...</span>
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
</>
      ) : ("")}
     
       </div>


      {/* Labels Section */}
     
        <>
        <div className=" px-2 mb-2 mt-2 border-t pt-4">
          <div onClick={() => setLabelOpen(!labelOpen)} className="flex gap-1 cursor-pointer items-center flex-row">

            {labelOpen  ? (
                         <ChevronDown className="size-3 text-gray-500" />
                       ) : (
                         <ChevronRight className="size-3 text-gray-500" />
                       )}

                  <span className="text-xs text-gray-500 ">Labels</span>

          </div>

         {labelOpen ? (
          <>
        <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
          <PopoverTrigger asChild disabled={!canEdit}>
            {task.labels && task.labels.length > 0 ? (<button className="flex  gap-3 px-2 py-2 hover:bg-gray-100 rounded-md w-full text-left">
              <Plus className="size-4 text-gray-400" />
              
            </button>) : 
            (
               <button className="flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded-md w-full text-left">
              <Tag className="size-4 text-gray-400" />
              <span className="text-[13px] font-normal text-gray-500">Add label</span>
            </button>)
          }
           
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-white border border-gray-200 text-gray-900 shadow-lg" align="start" side="left" sideOffset={8}>
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 mb-1">
                <Input
                  placeholder="Add labels..."
                  value={labelSearch}
                  onChange={(e) => setLabelSearch(e.target.value)}
                  className="h-7 border-0 focus-visible:ring-0 p-0 text-xs bg-transparent text-gray-900 placeholder:text-gray-400"
                />
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">L</span>
              </div>

              {/* Suggestions */}
              <div className="mb-2">
                <span className="text-xs text-gray-500 px-2">Suggestions</span>
                <div className="space-y-0.5 mt-1">
                  {suggestedLabels
                    .filter((l) => !(task.labels || []).includes(l))
                    .map((label) => (
                      <button
                        key={label}
                        onClick={() => handleAddLabel(label)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-gray-100 rounded text-sm"
                      >
                        <span
                          className={cn(
                            "size-3 rounded-full",
                            labelColors[label] || "bg-gray-400"
                          )}
                        />
                        <span className="text-xs tracking-normal">{label}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* All Labels */}
              <div>
                <span className="text-xs text-gray-500 px-2">Labels</span>
                <div className="space-y-0.5 mt-1">
                  {filteredLabels.map((label) => (
                    <button
                      key={label}
                      onClick={() => handleAddLabel(label)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-gray-100 rounded text-sm"
                    >
                      <span
                        className={cn(
                          "size-3 rounded-full",
                          labelColors[label] || "bg-gray-400"
                        )}
                      />
                      <span className="text-xs tracking-normal">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 px-2 mt-1">
            {task.labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100"
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    labelColors[label] || "bg-gray-400"
                  )}
                />
                {label}
              </span>
            ))}
          </div>
        )}

        </>

        ) : ("")}

      </div>
      </>
      

    
    </div>
  );
};
