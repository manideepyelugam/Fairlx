"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, TagIcon, XIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useUpdateBacklogItem } from "../api/use-update-backlog-item";
import { BacklogItem, BacklogItemPriority, BacklogItemType } from "../types";

const editItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(10000).optional(),
  priority: z.nativeEnum(BacklogItemPriority),
  type: z.nativeEnum(BacklogItemType),
  estimatedHours: z.string().optional(),
  dueDate: z.string().optional(),
  flagged: z.boolean(),
});

type EditItemValues = z.infer<typeof editItemSchema>;

interface EditBacklogItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BacklogItem;
}

export const EditBacklogItemDialog = ({
  open,
  onOpenChange,
  item,
}: EditBacklogItemDialogProps) => {
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(item.labels || []);
  const { mutate: updateItem, isPending } = useUpdateBacklogItem();

  const form = useForm<EditItemValues>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      title: item.title,
      description: item.description || "",
      priority: item.priority,
      type: item.type,
      estimatedHours: item.estimatedHours?.toString() || "",
      dueDate: item.dueDate || "",
      flagged: item.flagged,
    },
  });

  const onSubmit = (values: EditItemValues) => {
    updateItem(
      {
        param: { itemId: item.$id },
        json: {
          title: values.title,
          description: values.description || null,
          priority: values.priority,
          type: values.type,
          estimatedHours: values.estimatedHours ? parseInt(values.estimatedHours) : null,
          dueDate: values.dueDate || null,
          flagged: values.flagged,
          labels: tags,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Backlog Item</DialogTitle>
          <DialogDescription>
            Update the details of your backlog item
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter item title..."
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add a detailed description..."
                      rows={5}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value={BacklogItemPriority.LOW}>
                          Low
                        </SelectItem>
                        <SelectItem value={BacklogItemPriority.MEDIUM}>
                          Medium
                        </SelectItem>
                        <SelectItem value={BacklogItemPriority.HIGH}>
                          High
                        </SelectItem>
                        <SelectItem value={BacklogItemPriority.URGENT}>
                          Urgent
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={BacklogItemType.TASK}>
                          📋 Task
                        </SelectItem>
                        <SelectItem value={BacklogItemType.BUG}>
                          🐛 Bug
                        </SelectItem>
                        <SelectItem value={BacklogItemType.IDEA}>
                          💡 Idea
                        </SelectItem>
                        <SelectItem value={BacklogItemType.IMPROVEMENT}>
                          🚀 Improvement
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="e.g., 8"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags Section */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  disabled={isPending}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isPending || !newTag.trim()}
                  size="sm"
                >
                  <TagIcon className="size-4 mr-1" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isPending}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
