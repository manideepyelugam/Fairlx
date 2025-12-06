"use client";

import { Layers, Calendar } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useCreateWorkItem } from "../api/use-create-work-item";
import { useGetEpics } from "../api/use-get-epics";
import { useCreateWorkItemModal } from "../hooks/use-create-work-item-modal";
import { WorkItemType, WorkItemStatus, WorkItemPriority } from "../types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(WorkItemType),
  priority: z.nativeEnum(WorkItemPriority),
  projectId: z.string().min(1, "Project is required"),
  assigneeIds: z.array(z.string()).optional(),
  epicId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
});

export const CreateWorkItemModal = () => {
  const workspaceId = useWorkspaceId();
  const { isOpen, close, projectId: preselectedProjectId } = useCreateWorkItemModal();
  const { mutate: createWorkItem, isPending } = useCreateWorkItem();
  
  const { data: projects } = useGetProjects({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: WorkItemType.TASK,
      priority: WorkItemPriority.MEDIUM,
      projectId: "",
      assigneeIds: [],
      epicId: undefined,
      description: "",
      dueDate: undefined,
    },
  });

  const selectedProjectId = form.watch("projectId");
  const { data: epics } = useGetEpics({ 
    workspaceId, 
    projectId: selectedProjectId || undefined 
  });

  // Reset form when dialog opens/closes, and set preselected project
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: "",
        type: WorkItemType.TASK,
        priority: WorkItemPriority.MEDIUM,
        projectId: preselectedProjectId || "",
        assigneeIds: [],
        epicId: undefined,
        description: "",
        dueDate: undefined,
      });
    }
  }, [isOpen, preselectedProjectId, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createWorkItem(
      {
        title: values.title,
        type: values.type,
        priority: values.priority,
        workspaceId,
        projectId: values.projectId,
        status: WorkItemStatus.TODO,
        assigneeIds: values.assigneeIds || [],
        epicId: values.epicId,
        description: values.description,
        dueDate: values.dueDate as unknown as Date,
        flagged: false,
      },
      {
        onSuccess: () => {
          form.reset();
          close();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
          <DialogDescription>
            Add a new work item to your project backlog
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Selection */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.documents.map((project) => (
                        <SelectItem key={project.$id} value={project.$id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="What needs to be done?"
                      disabled={isPending}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type and Priority in a grid */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WorkItemType.STORY}>Story</SelectItem>
                        <SelectItem value={WorkItemType.BUG}>Bug</SelectItem>
                        <SelectItem value={WorkItemType.TASK}>Task</SelectItem>
                        <SelectItem value={WorkItemType.EPIC}>Epic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WorkItemPriority.LOW}>Low</SelectItem>
                        <SelectItem value={WorkItemPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={WorkItemPriority.HIGH}>High</SelectItem>
                        <SelectItem value={WorkItemPriority.URGENT}>Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Epic and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="epicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Epic (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                      value={field.value || "none"}
                      disabled={!selectedProjectId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Epic">
                            {field.value ? (
                              <div className="flex items-center gap-1.5">
                                <Layers className="size-3.5 text-purple-500" />
                                <span>{epics?.documents.find(e => e.$id === field.value)?.title || "Select Epic"}</span>
                              </div>
                            ) : (
                              "No Epic"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">No Epic</span>
                        </SelectItem>
                        {epics?.documents.map((epic) => (
                          <SelectItem key={epic.$id} value={epic.$id}>
                            <div className="flex items-center gap-1.5">
                              <Layers className="size-3.5 text-purple-500" />
                              <span>{epic.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assignee */}
            <FormField
              control={form.control}
              name="assigneeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? [] : [value])}
                    value={field.value?.[0] || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Unassigned</span>
                      </SelectItem>
                      {members?.documents.map((member) => (
                        <SelectItem key={member.$id} value={member.$id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add more details about this work item..."
                      disabled={isPending}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Work Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
