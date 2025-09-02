"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { createCustomColumnSchema } from "../schemas";
import { useCreateCustomColumn } from "../api/use-create-custom-column";
import { IconPicker } from "./icon-picker";
import { ColorPicker } from "./color-picker";

interface CreateCustomColumnFormProps {
  onCancel?: () => void;
}

type FormData = z.infer<typeof createCustomColumnSchema>;

export const CreateCustomColumnForm = ({ onCancel }: CreateCustomColumnFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateCustomColumn();

  const form = useForm<FormData>({
    resolver: zodResolver(createCustomColumnSchema.omit({ workspaceId: true })),
    defaultValues: {
      name: "",
      icon: "FiFlag",
      color: "#3b82f6",
    },
  });

  const onSubmit = (values: FormData) => {
    mutate({ 
      json: { 
        ...values, 
        workspaceId 
      } 
    }, {
      onSuccess: () => {
        form.reset();
        onCancel?.();
      },
    });
  };

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create Custom Column</CardTitle>
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
                    <FormLabel>Column Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Priority, Status" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <IconPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
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
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DottedSeparator className="py-7" />
            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                Create Column
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
