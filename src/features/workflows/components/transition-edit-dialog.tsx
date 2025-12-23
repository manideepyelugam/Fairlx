"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Shield, Users, Zap, CheckCircle2, Info, Loader2 } from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { WorkflowStatus, WorkflowTransition, TransitionCondition } from "../types";

// Team type for props
interface Team {
  $id: string;
  name: string;
}

const transitionFormSchema = z.object({
  name: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  // Team-based access control
  allowedTeamIds: z.array(z.string()).optional(),
  allowedMemberRoles: z.array(z.string()).optional(),
  // Approval workflow
  requiresApproval: z.boolean().default(false),
  approverTeamIds: z.array(z.string()).optional(),
  // Automation
  autoTransition: z.boolean().default(false),
  conditionType: z.enum(["NONE", "ALL_SUBTASKS_DONE", "APPROVAL_RECEIVED", "CUSTOM"]).default("NONE"),
});

type TransitionFormValues = z.infer<typeof transitionFormSchema>;

interface TransitionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transition?: WorkflowTransition | null;
  statuses: WorkflowStatus[];
  teams?: Team[];
  isLoadingTeams?: boolean;
  onSave: (data: Partial<WorkflowTransition>) => Promise<void>;
}

// Member roles for access control
const MEMBER_ROLES = [
  { key: "ADMIN", label: "Admin", description: "Full workspace access" },
  { key: "MEMBER", label: "Member", description: "Standard workspace member" },
  { key: "LEAD", label: "Team Lead", description: "Team leader role" },
  { key: "OWNER", label: "Owner", description: "Workspace owner" },
];

// Condition types for auto-transition
const CONDITION_TYPES = [
  { value: "NONE", label: "No Condition", description: "Manual transition only" },
  { value: "ALL_SUBTASKS_DONE", label: "All Subtasks Complete", description: "Auto-move when all subtasks are done" },
  { value: "APPROVAL_RECEIVED", label: "Approval Received", description: "Auto-move when approval is granted" },
  { value: "CUSTOM", label: "Custom Condition", description: "Define custom logic (coming soon)" },
];

export const TransitionEditDialog = ({
  open,
  onOpenChange,
  transition,
  statuses,
  teams = [],
  isLoadingTeams = false,
  onSave,
}: TransitionEditDialogProps) => {
  const fromStatus = statuses.find((s) => s.$id === transition?.fromStatusId);
  const toStatus = statuses.find((s) => s.$id === transition?.toStatusId);

  // Parse existing condition type
  const getConditionType = (): "NONE" | "ALL_SUBTASKS_DONE" | "APPROVAL_RECEIVED" | "CUSTOM" => {
    if (!transition?.conditions) return "NONE";
    const conditions = typeof transition.conditions === "string" 
      ? JSON.parse(transition.conditions) 
      : transition.conditions;
    return conditions?.type || "NONE";
  };

  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionFormSchema),
    defaultValues: {
      name: transition?.name || "",
      description: transition?.description || "",
      allowedTeamIds: transition?.allowedTeamIds || [],
      allowedMemberRoles: transition?.allowedMemberRoles || [],
      requiresApproval: transition?.requiresApproval || false,
      approverTeamIds: transition?.approverTeamIds || [],
      autoTransition: transition?.autoTransition || false,
      conditionType: getConditionType(),
    },
  });

  const watchRequiresApproval = form.watch("requiresApproval");
  const watchAutoTransition = form.watch("autoTransition");

  // Reset form when transition changes
  const resetForm = () => {
    form.reset({
      name: transition?.name || "",
      description: transition?.description || "",
      allowedTeamIds: transition?.allowedTeamIds || [],
      allowedMemberRoles: transition?.allowedMemberRoles || [],
      requiresApproval: transition?.requiresApproval || false,
      approverTeamIds: transition?.approverTeamIds || [],
      autoTransition: transition?.autoTransition || false,
      conditionType: getConditionType(),
    });
  };

  const onSubmit = async (values: TransitionFormValues) => {
    // Build conditions object
    let conditions: TransitionCondition | null = null;
    if (values.conditionType !== "NONE") {
      conditions = {
        type: values.conditionType as "ALL_SUBTASKS_DONE" | "APPROVAL_RECEIVED" | "CUSTOM",
      };
    }

    await onSave({
      name: values.name || null,
      description: values.description || null,
      allowedTeamIds: values.allowedTeamIds?.length ? values.allowedTeamIds : null,
      allowedMemberRoles: values.allowedMemberRoles?.length ? values.allowedMemberRoles : null,
      requiresApproval: values.requiresApproval,
      approverTeamIds: values.requiresApproval && values.approverTeamIds?.length ? values.approverTeamIds : null,
      autoTransition: values.autoTransition,
      conditions: conditions,
    });
    onOpenChange(false);
  };

  const toggleArrayField = (
    fieldName: "allowedTeamIds" | "allowedMemberRoles" | "approverTeamIds",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Transition</DialogTitle>
          <DialogDescription>
            Configure who can perform this transition and under what conditions
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

        <ScrollArea className="max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
                
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
                          placeholder="Instructions or notes for this transition..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Access Control Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-blue-500" />
                  <h4 className="text-sm font-medium">Access Control</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Control who can perform this transition. Leave both empty to allow everyone.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Allowed Teams */}
                <FormField
                  control={form.control}
                  name="allowedTeamIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="size-4" />
                        Allowed Teams
                      </FormLabel>
                      <FormDescription>
                        Only members of these teams can perform this transition
                      </FormDescription>
                      {isLoadingTeams ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Loading teams...
                        </div>
                      ) : teams.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No teams available</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {teams.map((team) => (
                            <Badge
                              key={team.$id}
                              variant={field.value?.includes(team.$id) ? "default" : "outline"}
                              className="cursor-pointer transition-colors hover:bg-primary/80"
                              onClick={() => toggleArrayField("allowedTeamIds", team.$id)}
                            >
                              {team.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Allowed Member Roles */}
                <FormField
                  control={form.control}
                  name="allowedMemberRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed Roles</FormLabel>
                      <FormDescription>
                        Only these roles can perform this transition. Leave empty to allow all.
                      </FormDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {MEMBER_ROLES.map((role) => (
                          <TooltipProvider key={role.key}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={field.value?.includes(role.key) ? "default" : "outline"}
                                  className="cursor-pointer transition-colors hover:bg-primary/80"
                                  onClick={() => toggleArrayField("allowedMemberRoles", role.key)}
                                >
                                  {role.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{role.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Approval Workflow Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <h4 className="text-sm font-medium">Approval Workflow</h4>
                </div>

                {/* Requires Approval Toggle */}
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requires Approval</FormLabel>
                        <FormDescription>
                          This transition must be approved before it takes effect
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

                {/* Approver Teams - Only show if requiresApproval is true */}
                {watchRequiresApproval && (
                  <FormField
                    control={form.control}
                    name="approverTeamIds"
                    render={({ field }) => (
                      <FormItem className="ml-4 pl-4 border-l-2 border-green-200">
                        <FormLabel>Approver Teams</FormLabel>
                        <FormDescription>
                          Members of these teams can approve this transition
                        </FormDescription>
                        {isLoadingTeams ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Loading teams...
                          </div>
                        ) : teams.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No teams available. Create teams first.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {teams.map((team) => (
                              <Badge
                                key={team.$id}
                                variant={field.value?.includes(team.$id) ? "default" : "outline"}
                                className="cursor-pointer transition-colors hover:bg-green-600"
                                onClick={() => toggleArrayField("approverTeamIds", team.$id)}
                              >
                                {team.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Automation Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  <h4 className="text-sm font-medium">Automation</h4>
                </div>

                {/* Auto Transition Toggle */}
                <FormField
                  control={form.control}
                  name="autoTransition"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Transition</FormLabel>
                        <FormDescription>
                          Automatically perform this transition when conditions are met
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

                {/* Condition Type - Only show if autoTransition is true */}
                {watchAutoTransition && (
                  <FormField
                    control={form.control}
                    name="conditionType"
                    render={({ field }) => (
                      <FormItem className="ml-4 pl-4 border-l-2 border-amber-200">
                        <FormLabel>Trigger Condition</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONDITION_TYPES.filter(c => c.value !== "NONE").map((condition) => (
                              <SelectItem key={condition.value} value={condition.value}>
                                <div className="flex flex-col">
                                  <span>{condition.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {condition.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter className="pt-4">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
