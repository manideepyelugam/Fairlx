"use client";

import { Plus, Layers } from "lucide-react";
import { useState } from "react";
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
  FormMessage,
} from "@/components/ui/form";

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
  const [isCreating, setIsCreating] = useState(false);
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
          setIsCreating(false);
          onSuccess?.();
        },
      }
    );
  };

  if (!isCreating) {
    return (
      <div className="flex items-center gap-2 border rounded-lg p-2 bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="flex-1 justify-start text-muted-foreground"
        >
          <Plus className="size-4 mr-2" />
          Add work item
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-2 border rounded-lg p-3 bg-background"
      >
        {/* First Row: Type, Priority, Epic */}
        <div className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="w-32">
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={WorkItemType.STORY}>Story</SelectItem>
                    <SelectItem value={WorkItemType.BUG}>Bug</SelectItem>
                    <SelectItem value={WorkItemType.TASK}>Task</SelectItem>
                    <SelectItem value={WorkItemType.EPIC}>Epic</SelectItem>
                    <SelectItem value={WorkItemType.SUBTASK}>Subtask</SelectItem>
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
              <FormItem className="w-32">
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
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
          <FormField
            control={form.control}
            name="epicId"
            render={({ field }) => (
              <FormItem className="flex-1">
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
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Epic (Optional)">
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
                    {onCreateEpic && (
                      <SelectItem value="__create_new__">
                        <div className="flex items-center gap-1.5 text-primary font-medium">
                          <Plus className="size-3.5" />
                          <span>Create New Epic</span>
                        </div>
                      </SelectItem>
                    )}
                    {epics?.documents.map((epic) => (
                      <SelectItem key={epic.$id} value={epic.$id}>
                        <div className="flex items-center gap-1.5">
                          <Layers className="size-3.5 text-purple-500" />
                          <span>{epic.title}</span>
                          <span className="text-xs text-muted-foreground">({epic.key})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Second Row: Title and Actions */}
        <div className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="What needs to be done?"
                    disabled={isPending}
                    autoFocus
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="h-9">
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                form.reset();
              }}
              disabled={isPending}
              className="h-9"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
