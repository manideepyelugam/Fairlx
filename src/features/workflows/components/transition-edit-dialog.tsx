"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { WorkflowStatus, WorkflowTransition } from "../types";

const transitionFormSchema = z.object({
  name: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  autoAssign: z.boolean().default(false),
  requiredFields: z.array(z.string()).optional(),
  allowedRoles: z.array(z.string()).optional(),
});

type TransitionFormValues = z.infer<typeof transitionFormSchema>;

interface TransitionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transition?: WorkflowTransition | null;
  statuses: WorkflowStatus[];
  onSave: (data: Partial<WorkflowTransition>) => Promise<void>;
}

// Common required fields that can be enforced
const AVAILABLE_REQUIRED_FIELDS = [
  { key: "description", label: "Description" },
  { key: "assignee", label: "Assignee" },
  { key: "dueDate", label: "Due Date" },
  { key: "priority", label: "Priority" },
  { key: "storyPoints", label: "Story Points" },
  { key: "labels", label: "Labels" },
];

// Common roles
const AVAILABLE_ROLES = [
  { key: "admin", label: "Admin" },
  { key: "member", label: "Member" },
  { key: "owner", label: "Owner" },
  { key: "developer", label: "Developer" },
  { key: "qa", label: "QA" },
  { key: "lead", label: "Team Lead" },
];

export const TransitionEditDialog = ({
  open,
  onOpenChange,
  transition,
  statuses,
  onSave,
}: TransitionEditDialogProps) => {
  const fromStatus = statuses.find((s) => s.$id === transition?.fromStatusId);
  const toStatus = statuses.find((s) => s.$id === transition?.toStatusId);

  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionFormSchema),
    defaultValues: {
      name: transition?.name || "",
      description: transition?.description || "",
      autoAssign: transition?.autoAssign || false,
      requiredFields: transition?.requiredFields || [],
      allowedRoles: transition?.allowedRoles || [],
    },
  });

  // Reset form when transition changes
  const resetForm = () => {
    form.reset({
      name: transition?.name || "",
      description: transition?.description || "",
      autoAssign: transition?.autoAssign || false,
      requiredFields: transition?.requiredFields || [],
      allowedRoles: transition?.allowedRoles || [],
    });
  };

  const onSubmit = async (values: TransitionFormValues) => {
    await onSave({
      ...values,
      name: values.name || null,
      description: values.description || null,
    });
    onOpenChange(false);
  };

  const toggleArrayField = (
    fieldName: "requiredFields" | "allowedRoles",
    value: string
  ) => {
    const current = form.getValues(fieldName) || [];
    if (current.includes(value)) {
      form.setValue(
        fieldName,
        current.filter((v) => v !== value)
      );
    } else {
      form.setValue(fieldName, [...current, value]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Transition</DialogTitle>
          <DialogDescription>
            Configure rules and settings for this transition
          </DialogDescription>
        </DialogHeader>

        {/* Transition Visual */}
        <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: fromStatus?.color || "#6B7280" }}
            />
            <span className="font-medium text-sm">{fromStatus?.name || "Unknown"}</span>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: toStatus?.color || "#6B7280" }}
            />
            <span className="font-medium text-sm">{toStatus?.name || "Unknown"}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transition Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Start Work, Submit for Review"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A friendly name shown when users change status
                  </FormDescription>
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
                      placeholder="Additional instructions for this transition..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto Assign */}
            <FormField
              control={form.control}
              name="autoAssign"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 text-amber-500" />
                      <FormLabel className="text-base">Auto-assign to me</FormLabel>
                    </div>
                    <FormDescription>
                      Automatically assign the item to the person making this transition
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

            {/* Required Fields */}
            <FormField
              control={form.control}
              name="requiredFields"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="size-4 text-blue-500" />
                    <FormLabel>Required Fields</FormLabel>
                  </div>
                  <FormDescription className="mb-3">
                    Fields that must be filled before this transition can be made
                  </FormDescription>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_REQUIRED_FIELDS.map((f) => (
                      <Badge
                        key={f.key}
                        variant={field.value?.includes(f.key) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleArrayField("requiredFields", f.key)}
                      >
                        {f.label}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Allowed Roles */}
            <FormField
              control={form.control}
              name="allowedRoles"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="size-4 text-green-500" />
                    <FormLabel>Allowed Roles</FormLabel>
                  </div>
                  <FormDescription className="mb-3">
                    Only these roles can perform this transition. Leave empty to allow all.
                  </FormDescription>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <Badge
                        key={role.key}
                        variant={field.value?.includes(role.key) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleArrayField("allowedRoles", role.key)}
                      >
                        {role.label}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
