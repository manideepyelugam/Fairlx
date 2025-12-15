"use client";

import { Building2, Folder, FolderKanban, ListTodo, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HierarchyDiagramProps {
  showPrograms?: boolean;
}

export const HierarchyDiagram = ({ showPrograms = true }: HierarchyDiagramProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Hierarchy
        </CardTitle>
        <CardDescription>
          Understanding how your work is organized
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workspace Level */}
        <div className="border-l-4 border-blue-500 pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-lg">Workspace</h3>
            <Badge variant="outline">Top Level</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Your whole company or organization. Contains all settings, spaces, and teams.
          </p>
        </div>

        {/* Space Level */}
        <div className="ml-6 border-l-4 border-green-500 pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Space</h3>
            <Badge variant="outline">Department/Product</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Big logical area based on department or product.
            <br />
            Examples: &quot;Engineering&quot;, &quot;Marketing&quot;, &quot;Operations&quot;
            <br />
            <strong>Key Feature:</strong> Provides work item prefix (e.g., ENG-123)
          </p>
        </div>

        {/* Teams Level - inside Spaces */}
        {showPrograms && (
          <div className="ml-12 border-l-4 border-purple-500 pl-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Teams</h3>
              <Badge variant="outline">Inside Space</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Groups of people who work together inside that space.
              <br />
              Example inside Engineering space:
              <br />
              • Frontend Team
              <br />
              • Backend Team
              <br />
              • DevOps Team
            </p>
          </div>
        )}

        {/* Project Level */}
        <div className="ml-12 border-l-4 border-orange-500 pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Project</h3>
            <Badge variant="outline">Work Stream</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Actual work streams owned by a team (or multiple teams).
            <br />
            Examples: &quot;Web App&quot;, &quot;Mobile App&quot;, &quot;Q1 Campaign&quot;
          </p>
        </div>

        {/* Work Items Level */}
        <div className="ml-16 border-l-4 border-pink-500 pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-pink-500" />
            <h3 className="font-semibold">Work Items</h3>
            <Badge variant="outline">Tasks</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Tasks, bugs, stories, epics with sprints, custom fields, and workflows.
          </p>
        </div>

        {/* Example Path */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Example Path:</p>
          <div className="text-sm font-mono text-muted-foreground">
            Acme Corp (Workspace)
            <span className="text-green-500"> → </span>
            Engineering (Space)
            <span className="text-purple-500"> → </span>
            Frontend Team
            <span className="text-orange-500"> → </span>
            Web Platform (Project)
            <span className="text-pink-500"> → </span>
            ENG-WEB-123
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
