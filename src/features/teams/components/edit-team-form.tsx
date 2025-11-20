"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { ImageIcon, Users2 } from "lucide-react";
import { useRef } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DottedSeparator } from "@/components/dotted-separator";
import { teamSchemas } from "@/features/teams/schemas";
import { TeamVisibility, Team } from "@/features/teams/types";
import { useUpdateTeam } from "@/features/teams/api/use-update-team";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetPrograms } from "@/features/programs/api/use-get-programs";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

interface EditTeamFormProps {
  onCancel?: () => void;
  initialValues: Team;
}

export const EditTeamForm = ({ onCancel, initialValues }: EditTeamFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate: updateTeam, isPending } = useUpdateTeam();

  const { data: members } = useGetMembers({ workspaceId });
  const { data: programs } = useGetPrograms({ workspaceId });

  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof teamSchemas.updateTeam>>({
    resolver: zodResolver(teamSchemas.updateTeam),
    defaultValues: {
      ...initialValues,
      imageUrl: initialValues.imageUrl ?? undefined,
      description: initialValues.description ?? undefined,
      programId: initialValues.programId ?? undefined,
      teamLeadId: initialValues.teamLeadId ?? undefined,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof teamSchemas.updateTeam>) => {
    updateTeam(
      {
        param: { teamId: initialValues.$id },
        json: values,
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
        <CardTitle className="text-xl font-bold">Edit Team</CardTitle>
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
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter team name" />
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
                        {...field}
                        placeholder="Enter team description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "NONE" ? undefined : value)}
                      defaultValue={field.value || "NONE"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">No Program</SelectItem>
                        {programs?.documents.map((program) => (
                          <SelectItem key={program.$id} value={program.$id}>
                            {program.name}
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
                name="teamLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Lead (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "NONE" ? undefined : value)}
                      defaultValue={field.value || "NONE"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">No Team Lead</SelectItem>
                        {members?.documents.map((member) => (
                          <SelectItem key={member.$id} value={member.userId}>
                            {member.name}
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
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TeamVisibility.ALL}>
                          All Workspace Members
                        </SelectItem>
                        <SelectItem value={TeamVisibility.PROGRAM_ONLY}>
                          Program Members Only
                        </SelectItem>
                        <SelectItem value={TeamVisibility.TEAM_ONLY}>
                          Team Members Only
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-x-5">
                      {field.value ? (
                        <div className="size-[72px] relative rounded-md overflow-hidden">
                          <Image
                            alt="Team image"
                            fill
                            className="object-cover"
                            src={field.value}
                          />
                        </div>
                      ) : (
                        <Avatar className="size-[72px]">
                          <AvatarFallback>
                            <Users2 className="size-[36px] text-neutral-400" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <p className="text-sm">Team Icon</p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, SVG or JPEG, max 1MB
                        </p>
                        <input
                          className="hidden"
                          type="file"
                          accept=".jpg, .png, .jpeg, .svg"
                          ref={inputRef}
                          onChange={handleImageChange}
                          disabled={isPending}
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
                            <ImageIcon className="size-4 mr-2" />
                            Upload Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
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
                className={!onCancel ? "invisible" : ""}
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit" size="lg">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
