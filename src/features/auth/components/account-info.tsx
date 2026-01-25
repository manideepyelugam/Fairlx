"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Calendar, Building2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Models } from "node-appwrite";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useUpdateDefaultPreferences } from "@/features/auth/api/use-update-default-preferences";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";

interface ProfileClientProps {
  initialData: Models.User<Models.Preferences>;
}

export const ProfileClient = ({ initialData }: ProfileClientProps) => {
  const prefs = initialData.prefs as {
    defaultWorkspaceId?: string | null;
  } || {};

  // State for selected default workspace
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    prefs.defaultWorkspaceId || null
  );

  // Fetch workspaces
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useGetWorkspaces();
  const { mutate: updateDefaultPreferences, isPending: isUpdating } = useUpdateDefaultPreferences();

  const workspaces = workspacesData?.documents || [];

  // Set first workspace as default if no default is set and workspaces are available
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].$id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspaceId(value || null);
  };

  const handleSaveDefaults = () => {
    updateDefaultPreferences({
      defaultWorkspaceId: selectedWorkspaceId,
    });
  };

  const hasChanges = selectedWorkspaceId !== (prefs.defaultWorkspaceId || null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="h-full w-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Default Workspace Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              Default Workspace
            </CardTitle>
            <CardDescription>
              Set your default workspace. This will be automatically selected when you open the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-4" />
                Default Workspace
              </Label>
              {isLoadingWorkspaces ? (
                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading workspaces...
                </div>
              ) : workspaces.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">
                  No workspaces available
                </p>
              ) : (
                <Select
                  value={selectedWorkspaceId || ""}
                  onValueChange={handleWorkspaceChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select default workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((workspace) => (
                      <SelectItem key={workspace.$id} value={workspace.$id}>
                        <div className="flex items-center gap-2">
                          <WorkspaceAvatar
                            name={workspace.name}
                            image={workspace.imageUrl}
                            className="size-5"
                          />
                          <span>{workspace.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveDefaults}
                disabled={!hasChanges || isUpdating}
                size="sm"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Default Preferences"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  User ID
                </Label>
                <p className="text-sm font-mono bg-neutral-50 p-2 rounded border">
                  {initialData.$id}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4" />
                  Account Created
                </Label>
                <p className="text-sm bg-neutral-50 p-2 rounded border">
                  {formatDate(initialData.$createdAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4" />
                  Last Updated
                </Label>
                <p className="text-sm bg-neutral-50 p-2 rounded border">
                  {formatDate(initialData.$updatedAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  Email Verification
                </Label>
                <p className="text-sm bg-neutral-50 p-2 rounded border">
                  {initialData.emailVerification ? (
                    <span className="text-green-600 font-medium">✓ Verified</span>
                  ) : (
                    <span className="text-amber-600 font-medium">⚠ Not Verified</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card> 

      </div>
    </div>
  );
};
