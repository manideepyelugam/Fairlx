"use client";

import { z } from "zod";
import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Folder, Globe, Lock, ImageIcon } from "lucide-react";
import Image from "next/image";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";
import { DottedSeparator } from "@/components/dotted-separator";
import { HelpTooltip } from "@/components/help-tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createSpaceSchema } from "../schemas";
import { useCreateSpace } from "../api/use-create-space";
import { SpaceVisibility, SpaceTemplate } from "../types";

interface CreateSpaceFormProps {
  onCancel?: () => void;
}

export const CreateSpaceForm = ({ onCancel }: CreateSpaceFormProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { mutate, isPending } = useCreateSpace();

  const inputRef = useRef<HTMLInputElement>(null);
  const keyManuallyEditedRef = useRef(false);

  const form = useForm<z.infer<typeof createSpaceSchema>>({
    resolver: zodResolver(createSpaceSchema.omit({ workspaceId: true })),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      visibility: SpaceVisibility.PUBLIC,
      template: SpaceTemplate.SOFTWARE,
    },
  });

  // Guard: Don't render the form if no valid workspaceId
  if (!workspaceId) {
    return (
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className="flex p-7">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Folder className="size-5" />
            Create a new Space
          </CardTitle>
        </CardHeader>
        <CardContent className="p-7 text-center text-muted-foreground">
          <p>Please select a workspace first to create a space.</p>
          {onCancel && (
            <Button variant="outline" className="mt-4" onClick={onCancel}>
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Auto-generate key from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    // Only auto-generate key if user hasn't manually edited it
    if (!keyManuallyEditedRef.current) {
      // Auto-generate key (uppercase, no spaces, max 10 chars)
      const key = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 10);

      form.setValue("key", key);
    }
  };

  const onSubmit = (values: z.infer<typeof createSpaceSchema>) => {
    // Create space without image first to prevent upload blocking creation
    const finalValues = {
      ...values,
      workspaceId,
      // Exclude image from initial creation - upload separately after success
      image: undefined,
    };

    mutate(
      { json: finalValues },
      {
        onSuccess: ({ data }) => {
          // TODO: If hasImage, upload image via updateSpace after creation
          // For now, create succeeds and image can be added in space settings
          form.reset();
          keyManuallyEditedRef.current = false;
          router.push(`/workspaces/${workspaceId}/spaces/${data.$id}`);
        },
        onError: () => {
          // Reset file input on error to prevent stale state (Issue 14)
          if (inputRef.current) {
            inputRef.current.value = "";
          }
          // Clear image from form state
          form.setValue("image", undefined);
        },
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
    }
  };

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Folder className="size-5" />
          Create a new Space
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
                    <FormLabel className="flex items-center gap-2">
                      Space Name
                      <HelpTooltip
                        content="A descriptive name for your space (e.g., 'Engineering', 'Marketing'). This helps identify the department or product area."
                        side="right"
                        align="start"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Engineering, Marketing"
                        {...field}
                        onChange={handleNameChange}
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
                    <FormLabel className="flex items-center gap-2">
                      Space Key
                      <HelpTooltip
                        content="A short uppercase identifier (2-10 characters). This will prefix all work items in this space. Example: Space key 'ENG' creates work items like 'ENG-123'."
                        side="right"
                        align="start"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ENG, MKT"
                        {...field}
                        onChange={(e) => {
                          keyManuallyEditedRef.current = true;
                          field.onChange(e);
                        }}
                        className="uppercase"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormDescription>
                      Used as prefix for project keys (e.g., ENG-PROJECT-1)
                    </FormDescription>
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
                        placeholder="Describe the purpose of this space"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SpaceVisibility.PUBLIC}>
                          <div className="flex items-center gap-2">
                            <Globe className="size-4" />
                            <span>Public - All workspace members can view</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={SpaceVisibility.PRIVATE}>
                          <div className="flex items-center gap-2">
                            <Lock className="size-4" />
                            <span>Private - Only invited members</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SpaceTemplate.SOFTWARE}>
                          Software Development (Scrum/Kanban)
                        </SelectItem>
                        <SelectItem value={SpaceTemplate.KANBAN_ONLY}>
                          Kanban Only
                        </SelectItem>
                        <SelectItem value={SpaceTemplate.MARKETING}>
                          Marketing Campaign
                        </SelectItem>
                        <SelectItem value={SpaceTemplate.OPERATIONS}>
                          Operations / IT Support
                        </SelectItem>
                        <SelectItem value={SpaceTemplate.CUSTOM}>
                          Custom (Start from scratch)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Pre-configured workflows and settings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-x-5">
                      {field.value ? (
                        <div className="size-[72px] relative rounded-md overflow-hidden">
                          <Image
                            src={
                              field.value instanceof File
                                ? URL.createObjectURL(field.value)
                                : field.value
                            }
                            alt="Space Image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <Avatar className="size-[72px]">
                          <AvatarFallback>
                            <ImageIcon className="size-[36px] text-neutral-400" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <p className="text-sm">Space Icon</p>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG, SVG, or GIF, max 1MB
                        </p>
                        <input
                          className="hidden"
                          accept=".jpg,.png,.jpeg,.svg,.gif"
                          type="file"
                          ref={inputRef}
                          disabled={isPending}
                          onChange={handleImageChange}
                        />
                        {field.value ? (
                          <Button
                            type="button"
                            disabled={isPending}
                            variant="destructive"
                            size="xs"
                            className="w-fit mt-2"
                            onClick={() => {
                              field.onChange(null);
                              if (inputRef.current) {
                                inputRef.current.value = "";
                              }
                            }}
                          >
                            Remove Image
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            disabled={isPending}
                            variant="teritary"
                            size="xs"
                            className="w-fit mt-2"
                            onClick={() => inputRef.current?.click()}
                          >
                            Upload Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          {...field}
                          value={field.value || "#6366f1"}
                          className="size-10 rounded border cursor-pointer"
                        />
                        <Input
                          placeholder="#6366f1"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-32"
                        />
                      </div>
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
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                Create Space
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
