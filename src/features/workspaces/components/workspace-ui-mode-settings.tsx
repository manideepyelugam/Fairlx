"use client";

import { Settings, Zap, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WorkspaceUIMode } from "../types";

interface WorkspaceUIModeSettingsProps {
  uiMode: WorkspaceUIMode;
  enabledFeatures?: {
    spaces?: boolean;
    programs?: boolean;
    teams?: boolean;
    customFields?: boolean;
    workflows?: boolean;
    timeTracking?: boolean;
  };
  onUIModeChange: (mode: WorkspaceUIMode) => void;
  onFeatureToggle: (feature: string, enabled: boolean) => void;
}

export const WorkspaceUIModeSettings = ({
  uiMode,
  enabledFeatures = {},
  onUIModeChange,
  onFeatureToggle,
}: WorkspaceUIModeSettingsProps) => {
  const isSimpleMode = uiMode === WorkspaceUIMode.SIMPLE;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Interface Complexity
          </CardTitle>
          <CardDescription>
            Choose how much functionality to show in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={uiMode}
            onValueChange={(value: string) => onUIModeChange(value as WorkspaceUIMode)}
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value={WorkspaceUIMode.SIMPLE} id="simple" />
              <div className="flex-1">
                <Label htmlFor="simple" className="flex items-center gap-2 cursor-pointer">
                  <Zap className="h-4 w-4" />
                  <span className="font-semibold">Simple Mode</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Best for small teams. Direct path: Workspace → Projects → Tasks.
                  Hides advanced features like Spaces, Programs, and Teams.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value={WorkspaceUIMode.ADVANCED} id="advanced" />
              <div className="flex-1">
                <Label htmlFor="advanced" className="flex items-center gap-2 cursor-pointer">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="font-semibold">Advanced Mode</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Full enterprise features. Includes Spaces, Programs, Teams, custom workflows,
                  and advanced permissions. Best for large organizations.
                </p>
              </div>
            </div>
          </RadioGroup>

          {isSimpleMode && (
            <Alert>
              <AlertDescription>
                Simple Mode is active. Advanced features are hidden from navigation and simplified workflows are in use.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {!isSimpleMode && (
        <Card>
          <CardHeader>
            <CardTitle>Enable/Disable Features</CardTitle>
            <CardDescription>
              Customize which advanced features are available in your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="spaces">Spaces</Label>
                <p className="text-sm text-muted-foreground">
                  Organize projects by department or product
                </p>
              </div>
              <Switch
                id="spaces"
                checked={enabledFeatures.spaces ?? true}
                onCheckedChange={(checked: boolean) => onFeatureToggle("spaces", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="programs">Programs & Teams</Label>
                <p className="text-sm text-muted-foreground">
                  Multi-team initiatives and team management
                </p>
              </div>
              <Switch
                id="programs"
                checked={enabledFeatures.programs ?? true}
                onCheckedChange={(checked: boolean) => onFeatureToggle("programs", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="customFields">Custom Fields</Label>
                <p className="text-sm text-muted-foreground">
                  Add custom fields to work items
                </p>
              </div>
              <Switch
                id="customFields"
                checked={enabledFeatures.customFields ?? true}
                onCheckedChange={(checked: boolean) => onFeatureToggle("customFields", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workflows">Custom Workflows</Label>
                <p className="text-sm text-muted-foreground">
                  Define custom status flows and transitions
                </p>
              </div>
              <Switch
                id="workflows"
                checked={enabledFeatures.workflows ?? true}
                onCheckedChange={(checked: boolean) => onFeatureToggle("workflows", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="timeTracking">Time Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Track time spent on work items
                </p>
              </div>
              <Switch
                id="timeTracking"
                checked={enabledFeatures.timeTracking ?? true}
                onCheckedChange={(checked: boolean) => onFeatureToggle("timeTracking", checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
