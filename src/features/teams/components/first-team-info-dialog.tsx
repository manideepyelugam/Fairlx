"use client";

import { CheckCircle2, Layers, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface FirstTeamInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FirstTeamInfoDialog = ({
  open,
  onOpenChange,
}: FirstTeamInfoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="size-6 text-primary" />
            Welcome to Team Management!
          </DialogTitle>
          <DialogDescription>
            You&apos;ve created your first team. Here&apos;s how team-based project assignment works.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Layers className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    Project Assignment Feature
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    As a workspace admin, you can now assign specific projects to teams. 
                    Teams will only see projects that have been assigned to them, creating 
                    focused workspaces for each team.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <CheckCircle2 className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    How It Works
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                    <li>• Go to any project settings as a workspace admin</li>
                    <li>• Assign one or more teams to that project</li>
                    <li>• Team members will only see their assigned projects</li>
                    <li>• Unassigned projects are visible to all workspace members</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  <Users className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    Benefits
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                    <li>• Better organization for large workspaces</li>
                    <li>• Teams focus only on their relevant projects</li>
                    <li>• Admins maintain full visibility and control</li>
                    <li>• Flexible - assign multiple teams to one project</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> This feature is only available when 
              you have at least one team. You can always change project assignments later from project settings.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
