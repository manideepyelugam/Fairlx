"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateWorkItem } from "../api/use-create-work-item";
import { WorkItemType, WorkItemStatus, WorkItemPriority } from "../types";

const createEpicSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: z.nativeEnum(WorkItemPriority).optional(),
  status: z.nativeEnum(WorkItemStatus).optional(),
});

type CreateEpicFormValues = z.infer<typeof createEpicSchema>;

interface CreateEpicDialogProps {
  workspaceId: string;
  projectId: string;
  open: boolean;
  onCloseAction: () => void;
}

export const CreateEpicDialog = ({
  workspaceId,
  projectId,
  open,
  onCloseAction,
}: CreateEpicDialogProps) => {
  const { mutate: createWorkItem, isPending } = useCreateWorkItem();

  const form = useForm<CreateEpicFormValues>({
    resolver: zodResolver(createEpicSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.TODO,
    },
  });

  const onSubmit = (values: CreateEpicFormValues) => {
    createWorkItem(
      {
        workspaceId,
        projectId,
        title: values.title,
        type: WorkItemType.EPIC,
        status: values.status || WorkItemStatus.TODO,
        priority: values.priority || WorkItemPriority.MEDIUM,
        description: values.description,
        assigneeIds: [],
      },
      {
        onSuccess: () => {
          form.reset();
          onCloseAction();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-5 text-purple-600" />
            Create New Epic
          </DialogTitle>
          <DialogDescription>
            Epics are large bodies of work that can be broken down into smaller work items
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Epic Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., User Authentication System"
                      disabled={isPending}
                    />
                  </FormControl>
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
                      placeholder="Describe the epic's goals and objectives..."
                      rows={4}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority and Status in a grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
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

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WorkItemStatus.TODO}>To Do</SelectItem>
                        <SelectItem value={WorkItemStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={WorkItemStatus.IN_REVIEW}>In Review</SelectItem>
                        <SelectItem value={WorkItemStatus.DONE}>Done</SelectItem>
                        <SelectItem value={WorkItemStatus.BLOCKED}>Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCloseAction}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Epic"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
