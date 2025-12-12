"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Circle, CheckCircle, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  WorkflowStatus,
  StatusCategory,
  STATUS_CATEGORY_CONFIG,
  STATUS_COLORS,
} from "../types";
import { cn } from "@/lib/utils";

const statusFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  key: z
    .string()
    .min(1, "Key is required")
    .max(30)
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Key must start with a letter, contain only uppercase letters, numbers, and underscores"
    ),
  category: z.nativeEnum(StatusCategory),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  description: z.string().max(200).optional(),
  isInitial: z.boolean().default(false),
  isFinal: z.boolean().default(false),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

interface StatusEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: WorkflowStatus | null;
  workflowId: string;
  existingKeys: string[];
  onSave: (data: Partial<WorkflowStatus>) => Promise<void>;
}

export const StatusEditDialog = ({
  open,
  onOpenChange,
  status,
  workflowId,
  existingKeys,
  onSave,
}: StatusEditDialogProps) => {
  const isEditing = !!status;

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: status?.name || "",
      key: status?.key || "",
      category: status?.category || StatusCategory.TODO,
      color: status?.color || "#6B7280",
      description: status?.description || "",
      isInitial: status?.isInitial || false,
      isFinal: status?.isFinal || false,
    },
  });

  // Reset form when status changes
  const resetForm = () => {
    form.reset({
      name: status?.name || "",
      key: status?.key || "",
      category: status?.category || StatusCategory.TODO,
      color: status?.color || "#6B7280",
      description: status?.description || "",
      isInitial: status?.isInitial || false,
      isFinal: status?.isFinal || false,
    });
  };

  // Auto-generate key from name
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!isEditing) {
      const key = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")
        .replace(/^[^A-Z]/, "S")
        .substring(0, 30);
      form.setValue("key", key);
    }
  };

  const onSubmit = async (values: StatusFormValues) => {
    // Validate key uniqueness
    if (!isEditing && existingKeys.includes(values.key)) {
      form.setError("key", { message: "This key already exists" });
      return;
    }

    await onSave({
      ...values,
      workflowId,
    });
    onOpenChange(false);
    resetForm();
  };

  const getCategoryIcon = (category: StatusCategory) => {
    switch (category) {
      case StatusCategory.TODO:
        return Circle;
      case StatusCategory.IN_PROGRESS:
        return Clock;
      case StatusCategory.DONE:
        return CheckCircle;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Status" : "Create New Status"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify the status properties"
              : "Add a new status to your workflow"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name & Key */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="In Progress"
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="IN_PROGRESS"
                        {...field}
                        disabled={isEditing}
                        className="font-mono uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(STATUS_CATEGORY_CONFIG).map(
                        ([key, config]) => {
                          const Icon = getCategoryIcon(key as StatusCategory);
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="size-4" />
                                <span>{config.label}</span>
                                <span className="text-muted-foreground text-xs">
                                  - {config.description}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        }
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => form.setValue("color", color.value)}
                        className={cn(
                          "w-8 h-8 rounded-lg border-2 transition-all",
                          field.value === color.value
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-8 h-8 rounded-lg border"
                      style={{ backgroundColor: field.value }}
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => form.setValue("color", e.target.value)}
                      className="w-28 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
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
                      placeholder="Brief description of this status..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Flags */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isInitial"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Initial Status</FormLabel>
                      <FormDescription>
                        New work items will start in this status
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFinal"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Final Status</FormLabel>
                      <FormDescription>
                        Mark this as a completion status
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Status"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
