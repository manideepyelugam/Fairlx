"use client";

import { Plus, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { useCreateWorkItem } from "../api/use-create-work-item";
import { useGetEpics } from "../api/use-get-epics";
import { WorkItemType, WorkItemStatus, WorkItemPriority } from "../types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(WorkItemType),
  priority: z.nativeEnum(WorkItemPriority),
  epicId: z.string().optional(),
});

interface CreateWorkItemBarProps {
  workspaceId: string;
  projectId: string;
  sprintId?: string | null;
  onSuccess?: () => void;
  onCreateEpic?: () => void;
}

export const CreateWorkItemBar = ({
  workspaceId,
  projectId,
  sprintId,
  onSuccess,
  onCreateEpic,
}: CreateWorkItemBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createWorkItem, isPending } = useCreateWorkItem();
  const { data: epics } = useGetEpics({ workspaceId, projectId });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: WorkItemType.STORY,
      priority: WorkItemPriority.MEDIUM,
      epicId: undefined,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createWorkItem(
      {
        ...values,
        workspaceId,
        projectId,
        sprintId,
        status: WorkItemStatus.TODO,
        assigneeIds: [],
        flagged: false,
      },
      {
        onSuccess: () => {
          form.reset();
          setIsOpen(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-7 px-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-600 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="size-3 mr-1.5" />
        Add work item
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
            <DialogTitle className="text-base font-semibold">Create Work Item</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new work item to your {sprintId ? "sprint" : "backlog"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="What needs to be done?"
                        disabled={isPending}
                        autoFocus
                        className="h-9 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Type, Priority, Epic in a grid */}
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={WorkItemType.STORY} className="text-xs">Story</SelectItem>
                          <SelectItem value={WorkItemType.BUG} className="text-xs">Bug</SelectItem>
                          <SelectItem value={WorkItemType.TASK} className="text-xs">Task</SelectItem>
                          <SelectItem value={WorkItemType.EPIC} className="text-xs">Epic</SelectItem>
                          <SelectItem value={WorkItemType.SUBTASK} className="text-xs">Subtask</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={WorkItemPriority.LOW} className="text-xs">Low</SelectItem>
                          <SelectItem value={WorkItemPriority.MEDIUM} className="text-xs">Medium</SelectItem>
                          <SelectItem value={WorkItemPriority.HIGH} className="text-xs">High</SelectItem>
                          <SelectItem value={WorkItemPriority.URGENT} className="text-xs">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="epicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Epic (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === "__create_new__") {
                            onCreateEpic?.();
                          } else {
                            field.onChange(value === "none" ? undefined : value);
                          }
                        }}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Epic">
                              {field.value ? (
                                <div className="flex items-center gap-1.5">
                                  <Layers className="size-3 text-purple-500" />
                                  <span className="truncate">{epics?.documents.find(e => e.$id === field.value)?.title || "Select Epic"}</span>
                                </div>
                              ) : (
                                "No Epic"
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">
                            <span className="text-muted-foreground">No Epic</span>
                          </SelectItem>
                          {onCreateEpic && (
                            <SelectItem value="__create_new__" className="text-xs">
                              <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                <Plus className="size-3" />
                                <span>Create New Epic</span>
                              </div>
                            </SelectItem>
                          )}
                          {epics?.documents.map((epic) => (
                            <SelectItem key={epic.$id} value={epic.$id} className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <Layers className="size-3 text-purple-500" />
                                <span className="truncate">{epic.title}</span>
                                <span className="text-[10px] text-muted-foreground">({epic.key})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  size="sm"
                  className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
