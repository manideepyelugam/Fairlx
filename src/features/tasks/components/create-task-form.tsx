"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { DatePicker } from "@/components/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createTaskFormSchema } from "../schemas";
import { useCreateTask } from "../api/use-create-task";
import { StatusSelector } from "@/features/custom-columns/components/status-selector";
import { PrioritySelector } from "./priority-selector";
import { LabelSelector } from "./label-management";
import { Textarea } from "@/components/ui/textarea";
import { AssigneeMultiSelect } from "./assignee-multi-select";
import { useConfirm } from "@/hooks/use-confirm";
import { CreateTaskAttachmentUpload } from "@/features/attachments/components/create-task-attachment-upload";
import { useUploadAttachment } from "@/features/attachments/hooks/use-upload-attachment";

interface CreateTaskFormProps {
  onCancel?: () => void;
  projectOptions: { id: string; name: string; imageUrl: string }[];
  memberOptions: { id: string; name: string; imageUrl?: string | null }[];
}

export const CreateTaskForm = ({
  onCancel,
  projectOptions,
  memberOptions,
}: CreateTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateTask();
  const { mutate: uploadAttachment } = useUploadAttachment();
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const [ConfirmDialog, confirm] = useConfirm(
    "Set start date to today?",
    "You haven't set a start date. Would you like to set it to today and create the task?",
    "primary",
    "Yes",
    "No"
  );

  // Mock available labels - in a real app, this would come from an API
  const availableLabels = [
    "frontend", "backend", "bug", "feature", "urgent", "documentation", 
    "testing", "design", "security", "performance", "api", "ui/ux"
  ];

  const form = useForm<z.infer<typeof createTaskFormSchema>>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      assigneeIds: [],
      labels: [],
      estimatedHours: undefined,
      priority: undefined,
      status: undefined,
      projectId: "",
      dueDate: undefined,
      endDate: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof createTaskFormSchema>) => {
    // Validate assignees - at least one is required
    const assigneeIds = values.assigneeIds && values.assigneeIds.length > 0 ? values.assigneeIds : [];
    
    if (assigneeIds.length === 0) {
      form.setError("assigneeIds", { message: "At least one assignee is required" });
      return;
    }

    // Validate description - it is required
    if (!values.description || values.description.trim() === "") {
      form.setError("description", { message: "Description is required" });
      return;
    }

    // If no start date is provided, show confirmation dialog
    if (!values.dueDate) {
      const shouldSetToday = await confirm();
      
      if (!shouldSetToday) {
        // User clicked "No", don't create the task
        return;
      }
      
      // User clicked "Yes", set the start date to today
      values.dueDate = new Date();
    }

    mutate(
      { 
        json: { 
          ...values, 
          workspaceId,
          assigneeIds
        } 
      },
      {
        onSuccess: (data) => {
          // Upload attachments if any
          if (attachmentFiles.length > 0 && data?.data) {
            const taskId = data.data.$id;
            attachmentFiles.forEach((file) => {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("taskId", taskId);
              formData.append("workspaceId", workspaceId);
              
              uploadAttachment({ form: formData });
            });
          }
          
          form.reset();
          setAttachmentFiles([]);
          onCancel?.();
        },
      }
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Card className="w-full h-full border-none shadow-none">
        <div className="w-full border  border-b-gray-200">
<CardHeader className="flex px-7 py-5">
        <CardTitle className="text-xl font-medium tracking-tight">Create a new task</CardTitle>
      </CardHeader>
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
                    <FormLabel>Task Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task name" {...field} />
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
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <DatePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigneeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignees</FormLabel>
                    <FormControl>
                      <AssigneeMultiSelect
                        memberOptions={memberOptions}
                        selectedAssigneeIds={field.value || []}
                        onAssigneesChange={field.onChange}
                        placeholder="Select assignees..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <StatusSelector
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select status"
                        projectId={form.watch("projectId")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                        {projectOptions.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-x-2">
                              <ProjectAvatar
                                className="size-6"
                                name={project.name}
                                image={project.imageUrl}
                              />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Enter estimated hours..."
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseFloat(value) || undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (Optional)</FormLabel>
                    <FormControl>
                      <PrioritySelector
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select priority"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="labels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labels (Optional)</FormLabel>
                    <FormControl>
                      <LabelSelector
                        selectedLabels={field.value ?? []}
                        onLabelsChange={field.onChange}
                        availableLabels={availableLabels}
                        placeholder="Add labels..."
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
                        placeholder="Enter task description..."
                        className="resize-none"
                        rows={4}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Attachments Section */}
              <div className="space-y-2">
                <FormLabel>Attachments (Optional)</FormLabel>
                <CreateTaskAttachmentUpload
                  files={attachmentFiles}
                  onFilesChange={setAttachmentFiles}
                />
              </div>
            </div>
            <div className="flex items-center mt-12 mb-3 gap-3">
             


              <button className="bg-blue-600 text-xs tracking-tight text-white py-3 px-5 font-semibold rounded-md" type="submit" disabled={isPending}>Create Task</button>
              <button onClick={onCancel} disabled={isPending} className="bg-red-500 text-xs tracking-tight text-white py-3 px-5 font-semibold rounded-md">Cancel</button>

            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    </>
  );
};
