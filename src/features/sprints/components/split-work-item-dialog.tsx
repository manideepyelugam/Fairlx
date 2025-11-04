"use client";

import { GitBranch, Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useSplitWorkItem } from "../api/use-split-work-item";
import { PopulatedWorkItem } from "../types";

const formSchema = z.object({
  newWorkItems: z.array(
    z.object({
      title: z.string().trim().min(1, "Title is required"),
      storyPoints: z.coerce.number().min(0).max(100).optional(),
    })
  ).min(2, "Must create at least 2 items when splitting"),
});

type FormValues = z.infer<typeof formSchema>;

interface SplitWorkItemDialogProps {
  workItem: PopulatedWorkItem;
  open: boolean;
  onClose: () => void;
}

export const SplitWorkItemDialog = ({
  workItem,
  open,
  onClose,
}: SplitWorkItemDialogProps) => {
  const { mutate: splitWorkItem, isPending } = useSplitWorkItem();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newWorkItems: [
        { title: "", storyPoints: 0 },
        { title: "", storyPoints: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "newWorkItems",
  });

  const onSubmit = (values: FormValues) => {
    splitWorkItem(
      {
        json: {
          originalWorkItemId: workItem.$id,
          newWorkItems: values.newWorkItems,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-5" />
            Split Work Item
          </DialogTitle>
          <DialogDescription>
            Break down &quot;{workItem.key}: {workItem.title}&quot; into smaller work items
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Original Work Item Info */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-sm font-medium mb-1">Original Work Item</div>
              <div className="text-xs text-muted-foreground">
                <div><strong>Key:</strong> {workItem.key}</div>
                <div><strong>Title:</strong> {workItem.title}</div>
                <div><strong>Story Points:</strong> {workItem.storyPoints || 0}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This item will remain unchanged. New items will inherit its properties.
              </p>
            </div>

            {/* New Work Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">New Work Items</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ title: "", storyPoints: 0 })}
                  className="h-8"
                >
                  <Plus className="size-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`newWorkItems.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`Work item ${index + 1} title`}
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`newWorkItems.${index}.storyPoints`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Story Points</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              disabled={isPending}
                              className="w-24"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="shrink-0 mt-6"
                      disabled={isPending}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {form.formState.errors.newWorkItems?.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.newWorkItems.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Splitting..." : "Split Work Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
