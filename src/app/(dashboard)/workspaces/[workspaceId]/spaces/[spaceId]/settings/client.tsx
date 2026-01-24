"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  ArrowLeft,
  Settings,
  Palette,
  Lock,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Workflow
} from "lucide-react";
import Link from "next/link";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { useUpdateSpace } from "@/features/spaces/api/use-update-space";
import { useDeleteSpace } from "@/features/spaces/api/use-delete-space";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useGetWorkflows } from "@/features/workflows/api/use-get-workflows";
import { SpaceVisibility } from "@/features/spaces/types";
import { SpaceWorkflowsModal } from "@/features/workflows/components/space-workflows-modal";

const SPACE_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Slate", value: "#64748b" },
];

export const SpaceSettingsClient = () => {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const workspaceId = useWorkspaceId();

  const { data: space, isLoading: isLoadingSpace } = useGetSpace({ spaceId });
  const { data: workflowsData } = useGetWorkflows({ workspaceId, spaceId });
  const { mutate: updateSpace, isPending: isUpdating } = useUpdateSpace();
  const { mutate: deleteSpace, isPending: isDeleting } = useDeleteSpace();
  const { isAdmin } = useCurrentMember({ workspaceId });

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [visibility, setVisibility] = useState<SpaceVisibility>(SpaceVisibility.PUBLIC);
  const [defaultWorkflowId, setDefaultWorkflowId] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isWorkflowsModalOpen, setIsWorkflowsModalOpen] = useState(false);

  // Initialize form values when space data loads
  useState(() => {
    if (space) {
      setName(space.name || "");
      setKey(space.key || "");
      setDescription(space.description || "");
      setColor(space.color || "#6366f1");
      setVisibility(space.visibility || SpaceVisibility.PUBLIC);
      setDefaultWorkflowId(space.defaultWorkflowId || "");
    }
  });

  if (isLoadingSpace) {
    return <PageLoader />;
  }

  if (!space) {
    return <PageError message="Space not found." />;
  }

  if (!isAdmin) {
    return <PageError message="You don't have permission to access space settings." />;
  }

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "name":
        setName(value);
        break;
      case "key":
        setKey(value.toUpperCase());
        break;
      case "description":
        setDescription(value);
        break;
      case "color":
        setColor(value);
        break;
      case "visibility":
        setVisibility(value as SpaceVisibility);
        break;
      case "defaultWorkflowId":
        setDefaultWorkflowId(value);
        break;
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSpace(
      {
        param: { spaceId },
        json: {
          name: name || space.name,
          key: key || space.key,
          description: description || space.description,
          color: color || space.color,
          visibility: visibility || space.visibility,
          defaultWorkflowId: defaultWorkflowId || undefined,
        },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteSpace(
      { param: { spaceId } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${workspaceId}/spaces`);
        },
      }
    );
  };

  const workflows = workflowsData?.documents ?? [];

  return (
    <div className="flex flex-col gap-y-6 max-w-4xl mx-auto">
      {/* Space Workflows Modal */}
      <SpaceWorkflowsModal
        isOpen={isWorkflowsModalOpen}
        onClose={() => setIsWorkflowsModalOpen(false)}
        spaceId={spaceId}
        spaceName={name || space.name}
        workspaceId={workspaceId}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/workspaces/${workspaceId}/spaces/${spaceId}`}>
            <Button variant="ghost" size="icon" className="size-9">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="size-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
              style={{ 
                backgroundColor: color || space.color || "#6366f1",
                boxShadow: `0 4px 12px -2px ${color || space.color || "#6366f1"}40`
              }}
            >
              {(name || space.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Space Settings
                <Badge variant="secondary" className="font-mono text-xs">
                  {key || space.key}
                </Badge>
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure {name || space.name} settings
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isUpdating}
          className="gap-2"
        >
          <Save className="size-4" />
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Separator />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>
            Basic information about your space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Space Name</Label>
              <Input
                id="name"
                value={name || space.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Enter space name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Space Key</Label>
              <Input
                id="key"
                value={key || space.key}
                onChange={(e) => handleFieldChange("key", e.target.value)}
                placeholder="e.g., ENG, MKT"
                className="font-mono uppercase"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Used as prefix for work items
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description || space.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Describe the purpose of this space..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how your space looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Theme Color</Label>
            <div className="flex flex-wrap gap-3">
              {SPACE_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  className={`size-10 rounded-lg transition-all hover:scale-110 ${
                    (color || space.color) === colorOption.value
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  onClick={() => handleFieldChange("color", colorOption.value)}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access & Visibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            <CardTitle>Access & Visibility</CardTitle>
          </div>
          <CardDescription>
            Control who can see and access this space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select 
              value={visibility || space.visibility} 
              onValueChange={(v) => handleFieldChange("visibility", v)}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SpaceVisibility.PUBLIC}>
                  <div className="flex items-center gap-2">
                    <Eye className="size-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">Visible to all workspace members</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={SpaceVisibility.PRIVATE}>
                  <div className="flex items-center gap-2">
                    <EyeOff className="size-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only invited members can access</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Workflow className="size-5 text-primary" />
            <CardTitle>Workflow Settings</CardTitle>
          </div>
          <CardDescription>
            Configure default workflow for new projects in this space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Workflow</Label>
            <Select 
              value={defaultWorkflowId || space.defaultWorkflowId || ""} 
              onValueChange={(v) => handleFieldChange("defaultWorkflowId", v)}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span className="text-muted-foreground">No default workflow</span>
                </SelectItem>
                {workflows.map((workflow) => (
                  <SelectItem key={workflow.$id} value={workflow.$id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              New projects will use this workflow by default. Projects can override with their own workflow.
            </p>
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setIsWorkflowsModalOpen(true)}
            >
              <Workflow className="size-4" />
              Manage Workflows
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions for this space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div>
              <h4 className="font-medium">Delete this space</h4>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the space and remove all projects from it.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="size-4 mr-2" />
                  Delete Space
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the space
                    <strong> {space.name}</strong> and remove all projects from it.
                    The projects themselves will not be deleted, just unassigned from this space.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete Space"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
