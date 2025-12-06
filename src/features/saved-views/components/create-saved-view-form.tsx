"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateSavedView } from "../api/use-create-saved-view";
import { createSavedViewSchema } from "../schemas";
import { SavedViewType, SavedViewScope, SortConfig, FilterGroup } from "../types";

interface CreateSavedViewFormProps {
  workspaceId: string;
  projectId?: string;
  spaceId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  // Pre-populate with current view state
  currentFilters?: FilterGroup;
  currentSort?: SortConfig[];
}

const VIEW_TYPE_OPTIONS = [
  { value: SavedViewType.LIST, label: "List View" },
  { value: SavedViewType.KANBAN, label: "Kanban Board" },
  { value: SavedViewType.CALENDAR, label: "Calendar" },
  { value: SavedViewType.TIMELINE, label: "Timeline" },
  { value: SavedViewType.BACKLOG, label: "Backlog" },
  { value: SavedViewType.DASHBOARD, label: "Dashboard" },
];

const SCOPE_OPTIONS = [
  { value: SavedViewScope.PERSONAL, label: "Private - Only you can see this view" },
  { value: SavedViewScope.PROJECT, label: "Project - All project members can see" },
  { value: SavedViewScope.WORKSPACE, label: "Workspace - All workspace members can see" },
];

const formSchema = createSavedViewSchema;
type FormValues = z.infer<typeof formSchema>;

export const CreateSavedViewForm = ({
  workspaceId,
  projectId,
  spaceId,
  onCancel,
  onSuccess,
  currentFilters,
  currentSort,
}: CreateSavedViewFormProps) => {
  const { mutate: createView, isPending } = useCreateSavedView();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspaceId,
      projectId: projectId || undefined,
      spaceId: spaceId || undefined,
      name: "",
      description: "",
      type: SavedViewType.LIST,
      filters: currentFilters || undefined,
      sort: currentSort || undefined,
      scope: SavedViewScope.PERSONAL,
      isDefault: false,
      isPinned: false,
    },
  });

  const onSubmit = (values: FormValues) => {
    createView(
      { json: values },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Save Current View</CardTitle>
      </CardHeader>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>View Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., My Sprint Tasks, High Priority Bugs"
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what this view shows..."
                      disabled={isPending}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select view type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VIEW_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SCOPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as default view</FormLabel>
                      <FormDescription>
                        Load this view automatically
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPinned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Pin to sidebar</FormLabel>
                      <FormDescription>
                        Quick access in navigation
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save View"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
