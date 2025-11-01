"use client";

import { Plus } from "lucide-react";
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
import { WorkItemType, WorkItemStatus, WorkItemPriority } from "../types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(WorkItemType),
});

interface CreateWorkItemBarProps {
  workspaceId: string;
  projectId: string;
  sprintId?: string | null;
  onSuccess?: () => void;
}

export const CreateWorkItemBar = ({
  workspaceId,
  projectId,
  sprintId,
  onSuccess,
}: CreateWorkItemBarProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const { mutate: createWorkItem, isPending } = useCreateWorkItem();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: WorkItemType.STORY,
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
        priority: WorkItemPriority.MEDIUM,
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
        className="flex items-start gap-2 border rounded-lg p-2 bg-background"
      >
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
                  <SelectTrigger>
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
          name="title"
          render={({ field }) => (
            <FormItem className="flex-1">
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
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
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
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};
