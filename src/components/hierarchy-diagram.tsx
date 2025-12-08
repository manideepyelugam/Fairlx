"use client";

import { Building2, Folder, FolderKanban, ListTodo, Network } from "lucide-react";
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
          <Network className="h-5 w-5" />
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
            Your organization or company. Contains all users, settings, and work.
          </p>
        </div>

        {/* Programs/Teams Level */}
        {showPrograms && (
          <div className="ml-6 border-l-4 border-purple-500 pl-4 space-y-2">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Programs & Teams</h3>
              <Badge variant="outline">Optional</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Programs:</strong> Cross-team initiatives (e.g., &quot;Cloud Migration&quot;)
              <br />
              <strong>Teams:</strong> Development teams with custom roles and permissions
            </p>
          </div>
        )}

        {/* Space Level */}
        <div className="ml-6 border-l-4 border-green-500 pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Space</h3>
            <Badge variant="outline">Recommended</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Logical container for related work by department or product.
            <br />
            Examples: &quot;Engineering&quot;, &quot;Marketing&quot;, &quot;Operations&quot;
            <br />
            <strong>Key Feature:</strong> Provides work item prefix (e.g., ENG-123)
          </p>
        </div>

        {/* Project Level */}
        <div className="ml-12 border-l-4 border-orange-500 pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Project</h3>
            <Badge variant="outline">Required</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            A specific stream of work with its own board (Scrum, Kanban, or Hybrid).
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
            Individual tasks, stories, bugs, epics with sprints, custom fields, and workflows.
          </p>
        </div>

        {/* Example Path */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Example Path:</p>
          <div className="text-sm font-mono text-muted-foreground">
            Acme Corp
            <span className="text-blue-500"> → </span>
            Engineering Space (ENG)
            <span className="text-green-500"> → </span>
            Web Platform Project
            <span className="text-orange-500"> → </span>
            Work Item: ENG-WEB-123
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
