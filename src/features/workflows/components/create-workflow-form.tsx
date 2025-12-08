"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";
import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { createWorkflowSchema } from "../schemas";
import { useCreateWorkflow } from "../api/use-create-workflow";
import { StatusCategory, DEFAULT_SOFTWARE_WORKFLOW } from "../types";

// Type for local status management
interface LocalStatus {
  name: string;
  key: string;
  category: StatusCategory;
  color: string;
  position: number;
  isInitial: boolean;
  isFinal: boolean;
}

interface CreateWorkflowFormProps {
  onCancel?: () => void;
  workspaceId?: string;
  spaceId?: string;
  projectId?: string;
}

const STATUS_CATEGORY_COLORS: Record<StatusCategory, string> = {
  [StatusCategory.TODO]: "#94a3b8",
  [StatusCategory.IN_PROGRESS]: "#3b82f6",
  [StatusCategory.DONE]: "#22c55e",
};

export const CreateWorkflowForm = ({ onCancel, workspaceId: propWorkspaceId, spaceId, projectId }: CreateWorkflowFormProps) => {
  const hookWorkspaceId = useWorkspaceId();
  const workspaceId = propWorkspaceId || hookWorkspaceId;
  const { mutate, isPending } = useCreateWorkflow();

  const [statuses, setStatuses] = useState<LocalStatus[]>(DEFAULT_SOFTWARE_WORKFLOW.statuses.map((s, i) => ({
    ...s,
    position: i,
    isInitial: i === 0,
    isFinal: s.category === StatusCategory.DONE,
  })));

  const form = useForm<z.infer<typeof createWorkflowSchema>>({
    resolver: zodResolver(createWorkflowSchema.omit({ workspaceId: true })),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
    },
  });

  const addStatus = () => {
    setStatuses([
      ...statuses,
      {
        name: "",
        key: "",
        category: StatusCategory.TODO,
        color: "#94a3b8",
        position: statuses.length,
        isInitial: false,
        isFinal: false,
      },
    ]);
  };

  const removeStatus = (index: number) => {
    setStatuses(statuses.filter((_: LocalStatus, i: number) => i !== index));
  };

  const updateStatus = (index: number, field: keyof LocalStatus, value: unknown) => {
    const newStatuses = [...statuses];
    (newStatuses[index] as unknown as Record<string, unknown>)[field] = value;
    
    // Auto-generate key from name
    if (field === "name") {
      newStatuses[index].key = (value as string)
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_")
        .substring(0, 20);
    }
    
    // Auto-set color based on category
    if (field === "category") {
      newStatuses[index].color = STATUS_CATEGORY_COLORS[value as StatusCategory];
    }
    
    setStatuses(newStatuses);
  };

  const onSubmit = (values: z.infer<typeof createWorkflowSchema>) => {
    mutate(
      { 
        json: {
          ...values,
          workspaceId,
          spaceId: spaceId || undefined,
          projectId: projectId || undefined,
        }
      },
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      }
    );
  };

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <GitBranch className="size-5" />
          Create Workflow
        </CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Software Development, Bug Tracking" 
                        {...field}
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe this workflow" 
                        className="resize-none"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as default workflow</FormLabel>
                      <FormDescription>
                        New projects will use this workflow by default
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DottedSeparator className="py-4" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Statuses</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addStatus}>
                    <Plus className="size-4 mr-1" />
                    Add Status
                  </Button>
                </div>

                <div className="space-y-3">
                  {statuses.map((status: LocalStatus, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <Input
                        placeholder="Status name"
                        value={status.name}
                        onChange={(e) => updateStatus(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={status.category}
                        onValueChange={(value) => updateStatus(index, "category", value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={StatusCategory.TODO}>To Do</SelectItem>
                          <SelectItem value={StatusCategory.IN_PROGRESS}>In Progress</SelectItem>
                          <SelectItem value={StatusCategory.DONE}>Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <input
                        type="color"
                        value={status.color}
                        onChange={(e) => updateStatus(index, "color", e.target.value)}
                        className="size-8 rounded border cursor-pointer"
                      />
                      {statuses.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStatus(index)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CATEGORY_COLORS).map(([category, color]) => (
                    <Badge
                      key={category}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: color, color }}
                    >
                      {category.replace("_", " ")}:{" "}
                      {statuses.filter((s: LocalStatus) => s.category === category).length}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DottedSeparator className="py-7" />

            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                disabled={isPending}
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                Create Workflow
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
