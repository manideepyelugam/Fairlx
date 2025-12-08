"use client";

import { 
  Eye, 
  Plus, 
  Star, 
  StarOff, 
  Lock, 
  Users, 
  LayoutList, 
  LayoutGrid, 
  Calendar,
  Trash2,
  MoreHorizontal,
  GanttChart,
  Layers,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetSavedViews } from "../api/use-get-saved-views";
import { useDeleteSavedView } from "../api/use-delete-saved-view";
import { useUpdateSavedView } from "../api/use-update-saved-view";
import { useCreateSavedViewModal } from "../hooks/use-create-saved-view-modal";
import { SavedView, SavedViewType, SavedViewScope } from "../types";

interface SavedViewsListProps {
  workspaceId: string;
  projectId?: string;
  onSelectView?: (view: SavedView) => void;
  selectedViewId?: string;
}

const getViewIcon = (viewType: SavedViewType) => {
  switch (viewType) {
    case SavedViewType.KANBAN:
      return <LayoutGrid className="size-4" />;
    case SavedViewType.CALENDAR:
      return <Calendar className="size-4" />;
    case SavedViewType.TIMELINE:
      return <GanttChart className="size-4" />;
    case SavedViewType.BACKLOG:
      return <Layers className="size-4" />;
    case SavedViewType.DASHBOARD:
      return <LayoutDashboard className="size-4" />;
    case SavedViewType.LIST:
    default:
      return <LayoutList className="size-4" />;
  }
};

export const SavedViewsList = ({
  workspaceId,
  projectId,
  onSelectView,
  selectedViewId,
}: SavedViewsListProps) => {
  const { open } = useCreateSavedViewModal();
  const { data, isLoading } = useGetSavedViews({ workspaceId, projectId });
  const { mutate: deleteView } = useDeleteSavedView();
  const { mutate: updateView } = useUpdateSavedView();

  const views = data?.documents || [];

  const handleDelete = (viewId: string) => {
    deleteView({ param: { viewId } });
  };

  const handleToggleDefault = (view: SavedView) => {
    updateView({
      param: { viewId: view.$id },
      json: {
        isDefault: !view.isDefault,
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="size-5" />
          Saved Views
        </CardTitle>
        <Button size="sm" variant="outline" onClick={open}>
          <Plus className="size-4 mr-1" />
          Save View
        </Button>
      </CardHeader>
      <CardContent>
        {views.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Eye className="size-10 mb-3 opacity-50" />
            <p className="text-sm">No saved views</p>
            <p className="text-xs mt-1">Save your current filters and settings</p>
          </div>
        ) : (
          <div className="space-y-1">
            {views.map((view: SavedView) => (
              <div
                key={view.$id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                  selectedViewId === view.$id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => onSelectView?.(view)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getViewIcon(view.type)}
                  <span className="text-sm font-medium truncate">
                    {view.name}
                  </span>
                  {view.isDefault && (
                    <Star className="size-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  )}
                  {view.scope === SavedViewScope.PERSONAL ? (
                    <Lock className="size-3 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Users className="size-3 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleToggleDefault(view)}>
                      {view.isDefault ? (
                        <>
                          <StarOff className="size-4 mr-2" />
                          Remove as default
                        </>
                      ) : (
                        <>
                          <Star className="size-4 mr-2" />
                          Set as default
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(view.$id)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete view
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
