"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Settings,
  Users,
  Shield,
  Trash2,
  ImageIcon,
  Info,
  X,
  Loader,
  Calendar,
  FolderKanban,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  Copy,
  Tag,
  Flag,
  Layers,
} from "lucide-react";
import { GoHome } from "react-icons/go";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Navbar } from "@/components/navbar";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { useUpdateProject, UpdateProjectRequest } from "@/features/projects/api/use-update-project";
import { useDeleteProject } from "@/features/projects/api/use-delete-project";
import { useGetProjectAnalytics } from "@/features/projects/api/use-get-project-analytics";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useGetTeams } from "@/features/teams/api/use-get-teams";
import { useAssignProjectToTeam } from "@/features/projects/api/use-assign-project-to-team";
import { useUnassignProjectFromTeam } from "@/features/projects/api/use-unassign-project-from-team";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { updateProjectSchema } from "@/features/projects/schemas";
import { WorkTypesSettings } from "@/features/projects/components/work-types-settings";
import { PrioritySettings } from "@/features/projects/components/priority-settings";
import { LabelSettings } from "@/features/projects/components/label-settings";
import { CopySettingsDialog } from "@/features/projects/components/copy-settings-dialog";

export const ProjectIdSettingsClient = () => {
  const projectId = useProjectId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("general");
  const [isCopySettingsOpen, setIsCopySettingsOpen] = useState(false);

  // Data fetching
  const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });
  const { data: analytics, isLoading: isLoadingAnalytics } = useGetProjectAnalytics({ projectId });
  const { data: teamsData, isLoading: isLoadingTeams } = useGetTeams({
    workspaceId: project?.workspaceId || "",
  });
  const { data: membersData } = useGetMembers({
    workspaceId: project?.workspaceId || "",
  });
  const { isLoading: isMemberLoading, isAdmin } = useCurrentMember({
    workspaceId: project?.workspaceId || "",
  });

  // Mutations
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { mutate: assignTeam, isPending: isAssigning } = useAssignProjectToTeam();
  const { mutate: unassignTeam, isPending: isUnassigning } = useUnassignProjectFromTeam();

  // Form setup
  const form = useForm<z.infer<typeof updateProjectSchema>>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      deadline: project?.deadline || "",
      image: project?.imageUrl || "",
      customWorkItemTypes: project?.customWorkItemTypes || [],
      customPriorities: project?.customPriorities || [],
      customLabels: project?.customLabels || [],
    },
  });

  // Update form when project data loads
  if (project && form.getValues("name") !== project.name && !isUpdating) {
    form.reset({
      name: project.name,
      description: project.description || "",
      deadline: project.deadline || "",
      image: project.imageUrl || "",
      customWorkItemTypes: project.customWorkItemTypes || [],
      customPriorities: project.customPriorities || [],
      customLabels: project.customLabels || [],
    });
  }

  const isLoading = isLoadingProject || isMemberLoading;
  const teams = teamsData?.documents || [];
  const members = membersData?.documents || [];
  const assignedTeamIds = project?.assignedTeamIds || [];
  const availableTeams = teams.filter((team) => !assignedTeamIds.includes(team.$id));

  if (isLoading) {
    return <PageLoader />;
  }

  if (!project) {
    return <PageError message="Project not found." />;
  }

  // Handlers
  const onSubmit = (values: z.infer<typeof updateProjectSchema>) => {
    // Convert nullable fields to undefined and build final values object
    const finalValues: Record<string, unknown> = {};

    Object.entries(values).forEach(([key, value]) => {
      if (value === null) {
        finalValues[key] = undefined;
      } else if (key === "image") {
        finalValues[key] = value instanceof File ? value : "";
      } else if (key === "customWorkItemTypes" || key === "customPriorities" || key === "customLabels") {
        // Stringify arrays for FormData
        finalValues[key] = JSON.stringify(value);
      } else {
        finalValues[key] = value;
      }
    });

    updateProject({ form: finalValues as unknown as UpdateProjectRequest["form"], param: { projectId: project.$id } });
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

  const handleAssignTeam = () => {
    if (!selectedTeamId) return;
    assignTeam(
      { param: { projectId: project.$id, teamId: selectedTeamId } },
      { onSuccess: () => setSelectedTeamId("") }
    );
  };

  const handleUnassignTeam = (teamId: string) => {
    unassignTeam({ param: { projectId: project.$id, teamId } });
  };

  const getTeamName = (teamId: string) => {
    return teams.find((team) => team.$id === teamId)?.name || "Unknown Team";
  };

  const getTeamMembers = (teamId: string) => {
    const team = teams.find((t) => t.$id === teamId);
    return team?.memberCount || 0;
  };

  // Get members working on this project (from assigned teams)
  const getProjectMembers = () => {
    // Return all workspace members for now
    // TODO: When team member IDs are available in Team type, filter by team membership
    return members;
  };

  const projectMembers = getProjectMembers();

  // Navigation items for the settings sidebar
  const settingsNavItems = [
    { id: "general", label: "General", icon: Settings },
    { id: "team", label: "Team Access", icon: Users },
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "types", label: "Work Types", icon: Layers },
    { id: "priorities", label: "Priorities", icon: Flag },
    { id: "labels", label: "Labels", icon: Tag },
    ...(isAdmin ? [{ id: "danger", label: "Danger Zone", icon: Shield, danger: true }] : []),
  ];

  return (
    <div className="min-h-screen flex">
      {/* Settings Sidebar */}
      <aside className="h-screen bg-neutral-50 w-[264px] overflow-hidden border-r-[1.5px] border-neutral-200 flex flex-col fixed left-0 top-0">
        <div className="flex items-center w-full py-5 px-4 border-b-[1.5px] border-neutral-200 flex-shrink-0">
          <Link href="/">
            <Image src="/Logo.png" className="object-contain" alt="logo" width={80} height={90} />
          </Link>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Navigation */}
          <div className="p-3 border-b-[1.5px] border-neutral-200 flex-shrink-0">
            <ul className="flex flex-col">
              <Link href={`/workspaces/${project.workspaceId}`}>
                <div className="flex items-center gap-2.5 p-2.5 rounded-md font-medium transition text-neutral-500 hover:bg-neutral-200">
                  <GoHome className="size-5 text-neutral-500" />
                  <p className="text-[13px] tracking-tight font-medium">Home</p>
                </div>
              </Link>
              <Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}`}>
                <div className="flex items-center gap-2.5 p-2.5 rounded-md font-medium transition text-neutral-500 hover:bg-neutral-200">
                  <FolderKanban className="size-5 text-neutral-500" />
                  <p className="text-[13px] tracking-tight font-medium">Back to Project</p>
                </div>
              </Link>
            </ul>
          </div>

          {/* Settings Navigation */}
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider px-2.5 mb-2">
              Project Settings
            </p>
            <ul className="flex flex-col">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-md font-medium transition w-full text-left",
                        isActive
                          ? "bg-neutral-200 shadow-sm text-primary"
                          : "text-neutral-500 hover:bg-neutral-100",
                        item.danger && "text-red-600 hover:bg-red-50"
                      )}
                    >
                      <Icon className={cn(
                        "size-5",
                        isActive ? "text-primary" : "text-neutral-500",
                        item.danger && "text-red-600"
                      )} />
                      <p className="text-[13px] tracking-tight font-medium">{item.label}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-[264px] w-full min-h-screen bg-white flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Content Area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Project Header Card */}
            <div className="w-full p-5 rounded-xl border flex items-center justify-between">
              <div className="flex items-start gap-5">
                <Avatar className="size-24 border-2 border-neutral-300">
                  {project.imageUrl ? (
                    <AvatarImage src={project.imageUrl} alt={project.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-semibold">
                      {project.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col">
                  <h1 className="text-[22px] font-semibold">{project.name}</h1>
                  <p className="text-[13px] text-neutral-500">Project Settings</p>
                  <p className="text-[13px] text-neutral-500">
                    Created {format(new Date(project.$createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsCopySettingsOpen(true)}>
                <Copy className="size-3.5 mr-2" />
                Copy Settings
              </Button>
            </div>

            <CopySettingsDialog
              open={isCopySettingsOpen}
              onOpenChange={setIsCopySettingsOpen}
              currentProjectId={project.$id}
              workspaceId={project.workspaceId}
            />

            {/* General Settings */}
            {activeTab === "general" && (
              <Card>
                <CardHeader className="mb-3">
                  <CardTitle className="!text-[18px]">Project Details</CardTitle>
                  <CardDescription className="!text-xs font-normal">
                    Update your project information and branding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              <FolderKanban className="size-4" />
                              Project Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter project name"
                                {...field}
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
                          <FormItem className="space-y-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter project description"
                                className="resize-none"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="size-4" />
                              Project Deadline
                            </FormLabel>
                            <div className="pt-1">
                              <DatePicker
                                value={field.value ? new Date(field.value) : undefined}
                                onChange={(date) => {
                                  field.onChange(date ? date.toISOString() : "");
                                }}
                                className="h-10"
                                size="default"
                                placeholder="Select deadline"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem className="space-y-2 !mb-5">
                            <FormLabel>Project Icon</FormLabel>
                            <div className="flex items-center gap-6">
                              {field.value ? (
                                <div className="size-24 relative rounded-lg overflow-hidden border-2 border-neutral-200">
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
                                <div className="size-24 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50">
                                  <ImageIcon className="size-8 text-neutral-400" />
                                </div>
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
                                  {field.value ? "Change Icon" : "Upload Icon"}
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
                                    Remove Icon
                                  </Button>
                                )}
                                <p className="text-xs text-neutral-500">
                                  JPG, PNG, SVG or JPEG (max 1MB)
                                </p>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isUpdating} size="xs" className="text-xs font-medium px-6 rounded-sm py-3">
                        {isUpdating ? (
                          <>
                            <Loader className="size-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Team Access */}
            {activeTab === "team" && (
              <Card>
                <CardHeader className="mb-3">
                  <CardTitle className="!text-[18px] flex items-center gap-2">
                    Team Access Control
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-6">
                            <Info className="size-4 text-neutral-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            Assign teams to control project access. If no teams are assigned,
                            all workspace members can access the project.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription className="!text-xs font-normal">
                    Manage which teams have access to this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Assigned Teams */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Assigned Teams</Label>
                    {assignedTeamIds.length === 0 ? (
                      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="size-5 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">No teams assigned</p>
                          <p className="text-xs text-amber-600">
                            All workspace members can access this project
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {assignedTeamIds.map((teamId) => (
                          <div
                            key={teamId}
                            className="flex items-center justify-between p-4 bg-neutral-50 border rounded-lg hover:border-neutral-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {getTeamName(teamId).charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{getTeamName(teamId)}</p>
                                <p className="text-xs text-neutral-500">
                                  {getTeamMembers(teamId)} members
                                </p>
                              </div>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleUnassignTeam(teamId)}
                                disabled={isAssigning || isUnassigning}
                              >
                                <X className="size-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Team */}
                  {isAdmin && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm font-semibold mb-3 block">Add Team</Label>
                        {isLoadingTeams ? (
                          <div className="flex items-center gap-2 text-neutral-500">
                            <Loader className="size-4 animate-spin" />
                            Loading teams...
                          </div>
                        ) : availableTeams.length === 0 ? (
                          <p className="text-sm text-neutral-500 italic">
                            {teams.length === 0
                              ? "No teams exist yet. Create a team first."
                              : "All teams are already assigned."}
                          </p>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Select
                              value={selectedTeamId}
                              onValueChange={setSelectedTeamId}
                              disabled={isAssigning || isUnassigning}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select a team" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTeams.map((team) => (
                                  <SelectItem key={team.$id} value={team.$id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={handleAssignTeam}
                              disabled={!selectedTeamId || isAssigning || isUnassigning}
                              size="xs"
                              className="text-xs font-medium px-6 rounded-sm py-3"
                            >
                              {isAssigning ? (
                                <Loader className="size-4 animate-spin" />
                              ) : (
                                "Add"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Project Members */}
                  <Separator />
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">
                      Project Members ({projectMembers.length})
                    </Label>
                    <p className="text-xs text-neutral-500 mb-4">
                      {assignedTeamIds.length === 0
                        ? "All workspace members have access"
                        : "Members from assigned teams"}
                    </p>
                    {projectMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {projectMembers.slice(0, 20).map((member) => (
                          <TooltipProvider key={member.$id} delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="size-10 border-2 border-white shadow-sm cursor-default">
                                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm">
                                    {member.name?.charAt(0)?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.name || member.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {projectMembers.length > 20 && (
                          <div className="size-10 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium text-neutral-600">
                            +{projectMembers.length - 20}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 italic">No members found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overview */}
            {activeTab === "overview" && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <ListTodo className="size-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {isLoadingAnalytics ? "..." : analytics?.taskCount || 0}
                          </p>
                          <p className="text-sm text-neutral-500">Total Tasks</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="size-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {isLoadingAnalytics ? "..." : analytics?.completedTaskCount || 0}
                          </p>
                          <p className="text-sm text-neutral-500">Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Clock className="size-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {isLoadingAnalytics ? "..." : analytics?.incompleteTaskCount || 0}
                          </p>
                          <p className="text-sm text-neutral-500">In Progress</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-red-100 flex items-center justify-center">
                          <AlertCircle className="size-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {isLoadingAnalytics ? "..." : analytics?.overdueTaskCount || 0}
                          </p>
                          <p className="text-sm text-neutral-500">Overdue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="mb-3">
                    <CardTitle className="!text-[18px]">Project Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
                        <Calendar className="size-5 text-neutral-500" />
                        <div>
                          <p className="text-sm text-neutral-500">Created</p>
                          <p className="font-medium text-sm">
                            {format(new Date(project.$createdAt), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
                        <Clock className="size-5 text-neutral-500" />
                        <div>
                          <p className="text-sm text-neutral-500">Last Updated</p>
                          <p className="font-medium text-sm">
                            {format(new Date(project.$updatedAt), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
                        <Users className="size-5 text-neutral-500" />
                        <div>
                          <p className="text-sm text-neutral-500">Teams Assigned</p>
                          <p className="font-medium text-sm">
                            {assignedTeamIds.length === 0
                              ? "All workspace members"
                              : `${assignedTeamIds.length} team${assignedTeamIds.length > 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
                        <Users className="size-5 text-neutral-500" />
                        <div>
                          <p className="text-sm text-neutral-500">Members with Access</p>
                          <p className="font-medium text-sm">{projectMembers.length} members</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Work Types */}
            {activeTab === "types" && (
              <Card>
                <CardHeader className="mb-3">
                  <CardTitle className="!text-[18px]">Work Item Types</CardTitle>
                  <CardDescription className="!text-xs font-normal">
                    Customize the types of work items available in this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="customWorkItemTypes"
                        render={({ field }) => (
                          <WorkTypesSettings
                            types={field.value || []}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Button type="submit" disabled={isUpdating} size="xs" className="text-xs font-medium px-6 rounded-sm py-3">
                        {isUpdating ? (
                          <>
                            <Loader className="size-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Priorities */}
            {activeTab === "priorities" && (
              <Card>
                <CardHeader className="mb-3">
                  <CardTitle className="!text-[18px]">Priorities</CardTitle>
                  <CardDescription className="!text-xs font-normal">
                    Define custom priorities and their order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="customPriorities"
                        render={({ field }) => (
                          <PrioritySettings
                            priorities={field.value || []}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Button type="submit" disabled={isUpdating} size="xs" className="text-xs font-medium px-6 rounded-sm py-3">
                        {isUpdating ? (
                          <>
                            <Loader className="size-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Labels */}
            {activeTab === "labels" && (
              <Card>
                <CardHeader className="mb-3">
                  <CardTitle className="!text-[18px]">Labels</CardTitle>
                  <CardDescription className="!text-xs font-normal">
                    Manage custom labels for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="customLabels"
                        render={({ field }) => (
                          <LabelSettings
                            labels={field.value || []}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Button type="submit" disabled={isUpdating} size="xs" className="text-xs font-medium px-6 rounded-sm py-3">
                        {isUpdating ? (
                          <>
                            <Loader className="size-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {activeTab === "danger" && isAdmin && (
              <Card className="border-red-200">
                <CardHeader className="mb-3">
                  <CardTitle className="!text-[18px] flex items-center gap-2 text-red-600">
                    <Shield className="size-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="!text-xs font-normal">
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900 text-sm">Delete this project</p>
                      <p className="text-xs text-red-700">
                        Once deleted, the project and all its data cannot be recovered.
                        This includes all tasks, sprints, comments, and attachments.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                          <Trash2 className="size-4 mr-2" />
                          Delete Project
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            project <span className="font-semibold">&quot;{project.name}&quot;</span> and
                            all associated data including tasks, sprints, comments, and
                            attachments.
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
                              "Delete Project"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
};
