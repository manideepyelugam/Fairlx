"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  Loader,
  Trash2,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useUpdateProject } from "@/features/projects/api/use-update-project";
import { useDeleteProject } from "@/features/projects/api/use-delete-project";
import { updateProjectSchema } from "@/features/projects/schemas";
import { Project } from "@/features/projects/types";

interface ProjectSettingsModalProps {
  project: Project;
  isAdmin: boolean;
}

export const ProjectSettingsModal = ({ project, isAdmin }: ProjectSettingsModalProps) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

  const form = useForm<z.infer<typeof updateProjectSchema>>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      image: project.imageUrl || "",
    },
  });

  const onSubmit = (values: z.infer<typeof updateProjectSchema>) => {
    const finalValues = {
      ...values,
      image: values.image instanceof File ? values.image : "",
    };
    updateProject(
      { form: finalValues, param: { projectId: project.$id } },
      {
        onSuccess: () => {
          setOpen(false);
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

  const handleDelete = () => {
    deleteProject(
      { param: { projectId: project.$id } },
      {
        onSuccess: () => {
          window.location.href = `/workspaces/${project.workspaceId}`;
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-input p-2 text-xs font-medium text-foreground shadow-sm hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Settings className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            {isAdmin ? "Update your project details" : "You need admin access to modify settings"}
          </DialogDescription>
        </DialogHeader>

        {!isAdmin ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <ShieldAlert className="size-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Admin Access Required</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              You need administrator privileges to view and modify project settings. Please contact your workspace admin.
            </p>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Icon</FormLabel>
                      <div className="flex items-center gap-4">
                        {field.value ? (
                          <div className="size-16 relative rounded-lg overflow-hidden border">
                            <Image
                              src={
                                field.value instanceof File
                                  ? URL.createObjectURL(field.value)
                                  : field.value
                              }
                              alt="Project icon"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <Avatar className="size-16">
                            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {project.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-2">
                          <input
                            className="hidden"
                            accept=".jpg,.png,.jpeg,.svg"
                            type="file"
                            ref={inputRef}
                            onChange={handleImageChange}
                            disabled={isUpdating}
                          />
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            disabled={isUpdating}
                          >
                            {field.value ? "Change" : "Upload"}
                          </Button>
                          {field.value && (
                            <Button
                              variant="ghost"
                              type="button"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                field.onChange(null);
                                if (inputRef.current) inputRef.current.value = "";
                              }}
                              disabled={isUpdating}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Danger Zone</p>
              <p className="text-xs text-muted-foreground">
                Deleting this project will remove all associated data permanently.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{project.name}&quot; and all its
                      tasks, sprints, and comments. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader className="size-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
