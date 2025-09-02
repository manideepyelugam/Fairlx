"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Trash2Icon, PlusIcon, EyeIcon, EyeOffIcon, Settings2Icon } from "lucide-react";
import { toast } from "sonner";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/hooks/use-confirm";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { TaskStatus } from "@/features/tasks/types";

import { createCustomColumnSchema } from "../schemas";
import { useCreateCustomColumn } from "../api/use-create-custom-column";
import { useDeleteCustomColumn } from "../api/use-delete-custom-column";
import { useGetCustomColumns } from "../api/use-get-custom-columns";
import { IconPicker } from "./icon-picker";
import { ColorPicker } from "./color-picker";
import { useDefaultColumns } from "../hooks/use-default-columns";
import { useMoveTasksFromDisabledColumn } from "../hooks/use-move-tasks-from-disabled-column";

interface ManageColumnsFormProps {
  onCancel?: () => void;
}

type FormData = z.infer<typeof createCustomColumnSchema>;

export const ManageColumnsForm = ({ onCancel }: ManageColumnsFormProps) => {
  const workspaceId = useWorkspaceId();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { mutate: createColumn, isPending: isCreating } = useCreateCustomColumn();
  const { mutate: deleteColumn, isPending: isDeleting } = useDeleteCustomColumn();
  const { data: customColumns, isLoading: isLoadingColumns } = useGetCustomColumns({ workspaceId });
  const { mutate: moveTasksFromDisabledColumn } = useMoveTasksFromDisabledColumn();
  
  const {
    defaultColumns,
    toggleColumn,
  } = useDefaultColumns(workspaceId);

  const [ConfirmHideDialog, confirmHide] = useConfirm(
    "Hide Column",
    "Are you sure you want to hide this column? All tasks in this column will be moved to 'Todo'.",
    "outline"
  );

  const [ConfirmDeleteDialog, confirmDelete] = useConfirm(
    "Delete Column",
    "Are you sure you want to delete this column? All tasks in this column will be moved to 'Todo'.",
    "destructive"
  );

  const form = useForm<FormData>({
    resolver: zodResolver(createCustomColumnSchema.omit({ workspaceId: true })),
    defaultValues: {
      name: "",
      icon: "FiFlag",
      color: "#3b82f6",
    },
  });

  const onSubmit = (values: FormData) => {
    createColumn({ 
      json: { 
        ...values, 
        workspaceId 
      } 
    }, {
      onSuccess: () => {
        form.reset();
        setShowCreateForm(false);
        toast.success("Column created successfully");
      },
    });
  };

  const handleDeleteCustomColumn = async (columnId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;

    deleteColumn({
      param: { customColumnId: columnId },
    });
  };

  const handleToggleDefaultColumn = async (columnId: TaskStatus) => {
    const column = defaultColumns.find(col => col.id === columnId);
    if (!column) return;

    if (column.isEnabled) {
      // Disabling column - move tasks first
      const ok = await confirmHide();
      if (!ok) return;

      // Move tasks from this column to TODO
      moveTasksFromDisabledColumn({ fromColumn: columnId });
    }
    
    toggleColumn(columnId);
    toast.success(`${column.name} column ${column.isEnabled ? 'hidden' : 'shown'}`);
  };

  if (isLoadingColumns) {
    return (
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className="flex p-7">
          <CardTitle className="text-xl font-bold">Manage Columns</CardTitle>
        </CardHeader>
        <CardContent className="p-7">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading columns...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ConfirmHideDialog />
      <ConfirmDeleteDialog />
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className="flex p-7">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Settings2Icon className="size-5" />
            Manage Columns
          </CardTitle>
        </CardHeader>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <CardContent className="p-7 space-y-6">
          {/* Custom Columns Section - Moved to top */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Custom Columns</h3>
                <Badge variant="secondary" className="text-xs">
                  {customColumns?.documents?.length || 0}
                </Badge>
              </div>
              {!showCreateForm && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="size-4 mr-2" />
                  Add Column
                </Button>
              )}
            </div>

            {/* Create Column Form - Show at top when creating */}
            {showCreateForm && (
              <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 mb-4">
                <div className="mb-4">
                  <h4 className="font-medium text-base mb-1">Create New Column</h4>
                  <p className="text-sm text-muted-foreground">Add a custom column to organize your tasks</p>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Column Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Priority, Status, Review"
                              className="h-11 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Icon</FormLabel>
                            <FormControl>
                              <div className="h-11">
                                <IconPicker
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Color</FormLabel>
                            <FormControl>
                              <div className="h-11">
                                <ColorPicker
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isCreating}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                      >
                        {isCreating ? "Creating..." : "Create Column"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreateForm(false);
                          form.reset();
                        }}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Custom Columns List */}
            {customColumns?.documents && customColumns.documents.length > 0 ? (
              <div className="space-y-3">
                {customColumns.documents.map((column) => (
                  <div key={column.$id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="size-5 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: column.color }} 
                      />
                      <span className="font-medium text-base">{column.name}</span>
                      <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                        Custom
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCustomColumn(column.$id)}
                      disabled={isDeleting}
                      className="hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2Icon className="size-4" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              !showCreateForm && (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                      <PlusIcon className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">No custom columns yet</p>
                      <p className="text-xs text-muted-foreground">Create your first custom column to get started</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateForm(true)}
                      className="mt-2"
                    >
                      <PlusIcon className="size-4 mr-2" />
                      Add Your First Column
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>

          <DottedSeparator />

          {/* Default Columns Section - Moved to bottom */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Default Columns</h3>
              <Badge variant="outline" className="text-xs">
                System
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Show or hide the default workflow columns. Hidden columns will move all tasks to &ldquo;Todo&rdquo;.
            </p>
            <div className="space-y-3">
              {defaultColumns.map((column) => (
                <div key={column.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{column.name}</span>
                    <Badge variant={column.isEnabled ? "default" : "secondary"} className="text-xs">
                      {column.isEnabled ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleDefaultColumn(column.id)}
                    className={column.isEnabled ? "hover:bg-orange-50 hover:text-orange-700" : "hover:bg-green-50 hover:text-green-700"}
                  >
                    {column.isEnabled ? (
                      <EyeOffIcon className="size-4 mr-2" />
                    ) : (
                      <EyeIcon className="size-4 mr-2" />
                    )}
                    {column.isEnabled ? "Hide" : "Show"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DottedSeparator />

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
