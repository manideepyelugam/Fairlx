"use client";

import { z } from "zod";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { updateWorkspaceSchema } from "../schemas";
import { Workspace } from "../types";
import { useUpdateWorkspace } from "../api/use-update-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { useDeleteWorkspace } from "../api/use-delete-workspace";


interface EditWorkspaceFormProps {
  onCancel?: () => void;
  initialValues: Workspace;
}

export const EditWorkspaceForm = ({
  onCancel,
  initialValues,
}: EditWorkspaceFormProps) => {
  const { mutate, isPending } = useUpdateWorkspace();
  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } =
    useDeleteWorkspace();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Workspace",
    "This action cannot be undone.",
    "destructive"
  );



  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      ...initialValues,
      image: initialValues.imageUrl ?? "",
    },
  });

  const handleDelete = async () => {
    const ok = await confirmDelete();

    if (!ok) return;

    deleteWorkspace(
      { param: { workspaceId: initialValues.$id } },
      {
        onSuccess: () => {
          window.location.href = "/";
        },
      }
    );
  };



  const onSubmit = (values: z.infer<typeof updateWorkspaceSchema>) => {
    const finalValues = {
      ...values,
      image: values.image instanceof File ? values.image : "",
    };

    mutate({ form: finalValues, param: { workspaceId: initialValues.$id } });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <DeleteDialog />

        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center text-center">
          {/* <Button
            size="sm"
            variant="secondary"
            onClick={
              onCancel
                ? onCancel
                : () => router.push(`/workspaces/${initialValues.$id}`)
            }
            className="mb-8 self-start ml-0"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button> */}

        </div>

        {/* Main Settings Card */}
        <Card className="w-full border-none shadow-sm rounded-2xl mb-8">
          <CardContent className="p-8 md:p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-8">
                  {/* Workspace Icon Section */}
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <div className="flex flex-col items-center text-center gap-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Workspace Icon
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, SVG or JPEG, max 1MB
                          </p>
                        </div>

                        <div className="relative">
                          {field.value ? (
                            <div className="size-[120px] relative rounded-xl overflow-hidden ring-2 ring-primary ring-offset-2">
                              <Image
                                src={
                                  field.value instanceof File
                                    ? URL.createObjectURL(field.value)
                                    : field.value
                                }
                                alt="Logo"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <Avatar className="size-[120px] ring-2 ring-border">
                              <AvatarFallback className="bg-muted">
                                <ImageIcon className="size-[48px] text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>

                        <input
                          className="hidden"
                          accept=".jpg, .png, .jpeg, .svg"
                          type="file"
                          ref={inputRef}
                          onChange={handleImageChange}
                          disabled={isPending}
                        />

                        <div className="flex flex-col gap-y-2 sm:flex-row gap-x-2">
                          {field.value ? (
                            <>
                              <Button
                                variant="outline"
                                type="button"
                                disabled={isPending}
                                onClick={() => inputRef.current?.click()}
                              >
                                Change Image
                              </Button>
                              <Button
                                variant="destructive"
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  field.onChange(null);
                                  if (inputRef.current) {
                                    inputRef.current.value = "";
                                  }
                                }}
                              >
                                Remove Image
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              type="button"
                              disabled={isPending}
                              onClick={() => inputRef.current?.click()}
                            >
                              <ImageIcon className="size-4 mr-2" />
                              Upload Image
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  />

                  <div className="h-px bg-border" />

                  {/* Workspace Name Section */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div>
                          <FormLabel className="text-base font-semibold">
                            Workspace Name
                          </FormLabel>
                          <p className="text-sm text-muted-foreground mt-1">
                            The name of your workspace
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Enter workspace name"
                            className="h-11 text-base rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="h-px bg-border my-8" />

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-4 justify-center">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isPending}
                      className="sm:flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="sm:flex-1"
                    size="lg"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="w-full border-2 border-destructive/20 bg-destructive/5 rounded-2xl">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col text-center">
              <h3 className="text-xl font-bold text-destructive mb-3">
                Danger Zone
              </h3>
              <p className="text-sm  text-muted-foreground mb-2">
                Deleting a workspace is irreversible and will remove all associated data.
              </p>

              <div className="h-px bg-destructive/20 mb-4" />

              <Button
                size="sm"
                variant="destructive"
                type="button"
                disabled={isPending || isDeletingWorkspace}
                onClick={handleDelete}
                className="w-full sm:w-auto mx-auto"
              >
                Delete Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
