"use client";

import { Link2, Plus, ArrowRight, ArrowLeft, GitBranch, AlertTriangle, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetWorkItemLinks } from "../api/use-get-work-item-links";
import { useDeleteWorkItemLink } from "../api/use-delete-work-item-link";
import { useCreateLinkModal } from "../hooks/use-create-link-modal";
import { WorkItemLink, WorkItemLinkType, LINK_TYPE_METADATA } from "../types";

interface WorkItemLinksListProps {
  workItemId: string;
}

const getLinkIcon = (linkType: WorkItemLinkType) => {
  const metadata = LINK_TYPE_METADATA[linkType];
  switch (metadata.category) {
    case "dependency":
      return <AlertTriangle className="size-4" />;
    case "relationship":
      return <Copy className="size-4" />;
    case "hierarchy":
      return <GitBranch className="size-4" />;
    default:
      return <Link2 className="size-4" />;
  }
};

const getLinkColor = (linkType: WorkItemLinkType): "default" | "destructive" | "outline" | "secondary" => {
  const metadata = LINK_TYPE_METADATA[linkType];
  switch (metadata.category) {
    case "dependency":
      return "destructive";
    case "relationship":
      return "secondary";
    case "hierarchy":
      return "outline";
    default:
      return "default";
  }
};

export const WorkItemLinksList = ({
  workItemId,
}: WorkItemLinksListProps) => {
  const { open } = useCreateLinkModal();
  const { data, isLoading } = useGetWorkItemLinks({ workItemId });
  const { mutate: deleteLink } = useDeleteWorkItemLink();

  const outgoingLinks = data?.outgoing || [];
  const incomingLinks = data?.incoming || [];
  const allLinks = [...outgoingLinks, ...incomingLinks];

  const handleDelete = (linkId: string) => {
    deleteLink({ param: { linkId }, query: { deleteInverse: "true" } });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" />
          Work Item Links
        </CardTitle>
        <Button size="sm" onClick={() => open(workItemId)}>
          <Plus className="size-4 mr-2" />
          Add Link
        </Button>
      </CardHeader>
      <CardContent>
        {allLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Link2 className="size-12 mb-4 opacity-50" />
            <p className="text-sm">No links found</p>
            <p className="text-xs mt-1">
              Link related work items together
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outgoingLinks.map((link: WorkItemLink) => (
              <div
                key={link.$id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={getLinkColor(link.linkType)}>
                    {getLinkIcon(link.linkType)}
                    <span className="ml-1">{LINK_TYPE_METADATA[link.linkType].label}</span>
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <span className="font-mono text-muted-foreground">
                      {link.targetWorkItemId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {link.description && (
                    <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {link.description}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleDelete(link.$id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {incomingLinks.map((link: WorkItemLink) => (
              <div
                key={link.$id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={getLinkColor(link.linkType)}>
                    {getLinkIcon(link.linkType)}
                    <span className="ml-1">{LINK_TYPE_METADATA[link.linkType].label}</span>
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowLeft className="size-4 text-muted-foreground" />
                    <span className="font-mono text-muted-foreground">
                      {link.sourceWorkItemId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {link.description && (
                    <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {link.description}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleDelete(link.$id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkItemLinksList;
