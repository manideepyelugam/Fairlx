"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";

import { useCreateSprint } from "../api/use-create-sprint";
import { SprintStatus } from "../types";

const formSchema = z.object({
  name: z.string().min(1, "Sprint name is required"),
  goal: z.string().optional(),
  status: z.nativeEnum(SprintStatus),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

interface CreateSprintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
}

export const CreateSprintDialog = ({
  isOpen,
  onClose,
  workspaceId,
  projectId,
}: CreateSprintDialogProps) => {
  const { mutate: createSprint, isPending } = useCreateSprint();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      goal: "",
      status: SprintStatus.PLANNED,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createSprint(
      {
        ...values,
        workspaceId,
        projectId,
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Sprint 1, Q1 2024"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint Goal (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What do you want to achieve in this sprint?"
                      disabled={isPending}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SprintStatus.PLANNED}>Planned</SelectItem>
                      <SelectItem value={SprintStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={SprintStatus.COMPLETED}>Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select start date"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select end date"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Create Sprint
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
