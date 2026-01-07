"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Users, FolderKanban, Layers3, CheckCircle2 } from "lucide-react";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useJoinWorkspace } from "../api/use-join-workspace";
import { useInviteCode } from "../hooks/use-invite-code";
import { useWorkspaceId } from "../hooks/use-workspace-id";

interface JoinWorkspaceFormProps {
  initialValues: {
    name: string;
    imageUrl?: string;
    memberCount?: number;
    spacesCount?: number;
    projectsCount?: number;
    organization?: {
      $id: string;
      name: string;
      imageUrl?: string;
    } | null;
    isMember?: boolean;
  };
}

export const JoinWorkspaceForm = ({
  initialValues,
}: JoinWorkspaceFormProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const inviteCode = useInviteCode();
  const { mutate, isPending } = useJoinWorkspace();

  const onSubmit = () => {
    mutate(
      { param: { workspaceId }, json: { code: inviteCode } },
      {
        onSuccess: ({ data }) => {
          router.push(`/workspaces/${data.$id}`);
        },
      }
    );
  };

  // If already a member, show different UI
  if (initialValues.isMember) {
    return (
      <Card className="size-full border-none shadow-none">
        <CardHeader className="p-7 text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="size-20 border-2 border-primary">
              <AvatarImage src={initialValues.imageUrl} alt={initialValues.name} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {initialValues.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold">{initialValues.name}</CardTitle>
          <div className="flex items-center justify-center gap-2 pt-2">
            <CheckCircle2 className="size-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">You&apos;re already a member</span>
          </div>
          {initialValues.organization && (
            <div className="flex items-center justify-center gap-2 pt-3">
              <Building2 className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Part of <strong>{initialValues.organization.name}</strong>
              </span>
            </div>
          )}
        </CardHeader>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <CardContent className="p-7">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
              <Users className="size-5 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{initialValues.memberCount || 0}</span>
              <span className="text-xs text-muted-foreground">Members</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
              <Layers3 className="size-5 text-purple-500 mb-2" />
              <span className="text-2xl font-bold">{initialValues.spacesCount || 0}</span>
              <span className="text-xs text-muted-foreground">Spaces</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
              <FolderKanban className="size-5 text-green-500 mb-2" />
              <span className="text-2xl font-bold">{initialValues.projectsCount || 0}</span>
              <span className="text-xs text-muted-foreground">Projects</span>
            </div>
          </div>
          <Button
            size="lg"
            type="button"
            className="w-full"
            onClick={() => router.push(`/workspaces/${workspaceId}`)}
          >
            Go to Workspace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="size-full border-none shadow-none">
      <CardHeader className="p-7 text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="size-20 border-2 border-primary">
            <AvatarImage src={initialValues.imageUrl} alt={initialValues.name} />
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {initialValues.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-2xl font-bold">Join {initialValues.name}</CardTitle>
        <CardDescription className="pt-2">
          You&apos;ve been invited to join this workspace
        </CardDescription>
        {initialValues.organization && (
          <div className="flex items-center justify-center gap-2 pt-3">
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <Building2 className="size-3" />
              {initialValues.organization.name}
            </Badge>
          </div>
        )}
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 border">
            <Users className="size-5 text-blue-500 mb-2" />
            <span className="text-2xl font-bold">{initialValues.memberCount || 0}</span>
            <span className="text-xs text-muted-foreground">Members</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 border">
            <Layers3 className="size-5 text-purple-500 mb-2" />
            <span className="text-2xl font-bold">{initialValues.spacesCount || 0}</span>
            <span className="text-xs text-muted-foreground">Spaces</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 border">
            <FolderKanban className="size-5 text-green-500 mb-2" />
            <span className="text-2xl font-bold">{initialValues.projectsCount || 0}</span>
            <span className="text-xs text-muted-foreground">Projects</span>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-2 items-center justify-between">
          <Button
            size="lg"
            variant="secondary"
            type="button"
            asChild
            className="w-full lg:w-fit"
            disabled={isPending}
          >
            <Link href="/">Cancel</Link>
          </Button>
          <Button
            size="lg"
            type="button"
            className="w-full lg:w-fit"
            onClick={onSubmit}
            disabled={isPending}
          >
            Join Workspace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
