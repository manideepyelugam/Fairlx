"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";




export const ProjectTeamAssignment = () => {
  return (
    <Card className="w-full h-full border-none shadow-none bg-muted/20">
      <CardContent className="p-7">
        <div className="flex flex-col gap-y-4 text-center items-center justify-center py-8">
          <Info className="size-8 text-muted-foreground mb-2" />
          <h3 className="font-semibold text-muted-foreground">Legacy Feature Removed</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Workspace teams are no longer supported. Please use the new Project Teams feature to manage access and members.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
