"use client";

import { useState } from "react";
import { Settings, Shield, Eye, Globe, Users, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { RoleManagement } from "./role-management";
import { Team, TeamVisibility, CustomRole } from "../types";
import { useConfirm } from "@/hooks/use-confirm";

interface TeamSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  customRoles?: CustomRole[];
  onUpdateTeam?: (data: Partial<Team>) => void;
  onDeleteTeam?: () => void;
  onCreateRole?: (role: Omit<CustomRole, "$id" | "$createdAt" | "$updatedAt">) => void;
  onUpdateRole?: (roleId: string, role: Partial<CustomRole>) => void;
  onDeleteRole?: (roleId: string) => void;
}

export const TeamSettingsModal = ({
  open,
  onOpenChange,
  team,
  customRoles,
  onUpdateTeam,
  onDeleteTeam,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: TeamSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || "");
  const [visibility, setVisibility] = useState(team.visibility);

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Team",
    "Are you sure you want to delete this team? This action cannot be undone. All team data, tasks, and sprints will be permanently deleted.",
    "destructive"
  );

  const handleSaveGeneral = () => {
    onUpdateTeam?.({
      name: name.trim(),
      description: description.trim() || undefined,
      visibility,
    });
  };

  const handleDeleteTeam = async () => {
    const ok = await confirm();
    if (!ok) return;
    onDeleteTeam?.();
    onOpenChange(false);
  };

  const hasChanges = 
    name !== team.name || 
    description !== (team.description || "") ||
    visibility !== team.visibility;

  return (
    <>
      <ConfirmDialog />
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Team Settings
            </DialogTitle>
            <DialogDescription>
              Manage team settings, roles, and permissions
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general" className="gap-2">
                  <Globe className="size-3.5" />
                  General
                </TabsTrigger>
                <TabsTrigger value="roles" className="gap-2">
                  <Shield className="size-3.5" />
                  Roles
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* General Settings */}
              <TabsContent value="general" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Team Information</CardTitle>
                    <CardDescription className="text-xs">
                      Update your team&apos;s basic information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Team Name *</Label>
                      <Input
                        id="team-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter team name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team-description">Description</Label>
                      <Textarea
                        id="team-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter team description"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team-visibility">Team Visibility</Label>
                      <Select value={visibility} onValueChange={(value) => setVisibility(value as TeamVisibility)}>
                        <SelectTrigger id="team-visibility">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TeamVisibility.ALL}>
                            <div className="flex items-center gap-2">
                              <Globe className="size-3.5" />
                              <div>
                                <div className="font-medium">All Members</div>
                                <div className="text-xs text-muted-foreground">
                                  Visible to everyone in workspace
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={TeamVisibility.PROGRAM_ONLY}>
                            <div className="flex items-center gap-2">
                              <Users className="size-3.5" />
                              <div>
                                <div className="font-medium">Program Only</div>
                                <div className="text-xs text-muted-foreground">
                                  Visible to program members only
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={TeamVisibility.TEAM_ONLY}>
                            <div className="flex items-center gap-2">
                              <Eye className="size-3.5" />
                              <div>
                                <div className="font-medium">Team Only</div>
                                <div className="text-xs text-muted-foreground">
                                  Visible to team members only
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        onClick={handleSaveGeneral} 
                        disabled={!hasChanges || !name.trim()}
                        size="sm"
                      >
                        <Save className="size-4 mr-2" />
                        Save Changes
                      </Button>
                      {hasChanges && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setName(team.name);
                            setDescription(team.description || "");
                            setVisibility(team.visibility);
                          }}
                        >
                          <X className="size-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                    <CardDescription className="text-xs">
                      Irreversible actions for this team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between p-3 border border-destructive/50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Delete Team</h4>
                        <p className="text-xs text-muted-foreground">
                          Permanently delete this team and all associated data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteTeam}
                        className="gap-2"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Roles Management */}
              <TabsContent value="roles" className="mt-4">
                <RoleManagement
                  teamId={team.$id}
                  customRoles={customRoles}
                  onCreateRole={onCreateRole}
                  onUpdateRole={onUpdateRole}
                  onDeleteRole={onDeleteRole}
                />
              </TabsContent>

              {/* Permissions tab removed per UX request */}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
