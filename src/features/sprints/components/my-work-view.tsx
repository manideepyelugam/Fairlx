"use client";

import { useMemo, useState } from "react";
import { useQueryState } from "nuqs";
import { 
  Search, 
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flag,
  Layers
} from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useGetProjects } from "@/features/projects/api/use-get-projects";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetWorkItems } from "../api/use-get-work-items";
import { WorkItemCard } from "./work-item-card";
import { 
  WorkItemStatus, 
  WorkItemPriority, 
  PopulatedWorkItem 
} from "../types";
import { cn } from "@/lib/utils";
import { isAfter, isBefore, addDays } from "date-fns";

export const MyWorkView = () => {
  const workspaceId = useWorkspaceId();
  const { member: currentMember } = useCurrentMember({ workspaceId });
  const [view, setView] = useQueryState("view", { defaultValue: "board" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const { data: projects } = useGetProjects({ workspaceId });

  // Fetch work items assigned to current user
  const { data: workItems, isLoading } = useGetWorkItems({
    workspaceId,
    assigneeId: currentMember?.$id,
  });

  // Filter and organize work items
  const filteredWorkItems = useMemo(() => {
    if (!workItems?.documents) return [];

    let items = workItems.documents as PopulatedWorkItem[];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.key.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      items = items.filter((item) => item.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      items = items.filter((item) => item.priority === priorityFilter);
    }

    // Apply project filter
    if (projectFilter !== "all") {
      items = items.filter((item) => item.projectId === projectFilter);
    }

    return items;
  }, [workItems, searchQuery, statusFilter, priorityFilter, projectFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const items = workItems?.documents || [];
    const today = new Date();
    
    return {
      total: items.length,
      todo: items.filter((i) => i.status === WorkItemStatus.TODO).length,
      inProgress: items.filter((i) => i.status === WorkItemStatus.IN_PROGRESS).length,
      inReview: items.filter((i) => i.status === WorkItemStatus.IN_REVIEW).length,
      done: items.filter((i) => i.status === WorkItemStatus.DONE).length,
      assigned: items.filter((i) => i.status === WorkItemStatus.ASSIGNED).length,
      flagged: items.filter((i) => i.flagged).length,
      overdue: items.filter((i) => {
        if (!i.dueDate || i.status === WorkItemStatus.DONE) return false;
        return isBefore(new Date(i.dueDate), today);
      }).length,
      dueSoon: items.filter((i) => {
        if (!i.dueDate || i.status === WorkItemStatus.DONE) return false;
        const dueDate = new Date(i.dueDate);
        return isAfter(dueDate, today) && isBefore(dueDate, addDays(today, 7));
      }).length,
    };
  }, [workItems]);

  // Group items by status for board view
  const itemsByStatus = useMemo(() => {
    const grouped: Record<WorkItemStatus, PopulatedWorkItem[]> = {
      [WorkItemStatus.TODO]: [],
      [WorkItemStatus.IN_PROGRESS]: [],
      [WorkItemStatus.IN_REVIEW]: [],
      [WorkItemStatus.DONE]: [],
      [WorkItemStatus.ASSIGNED]: [],
    };

    filteredWorkItems.forEach((item) => {
      if (grouped[item.status as WorkItemStatus]) {
        grouped[item.status as WorkItemStatus].push(item);
      }
    });

    return grouped;
  }, [filteredWorkItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">My Work</h1>
            <p className="text-sm text-muted-foreground">
              All work items assigned to you across projects
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">To Do</p>
                <p className="text-xl font-semibold">{stats.todo}</p>
              </div>
              <div className="h-4 w-4 rounded-full bg-gray-400" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-semibold">{stats.inProgress}</p>
              </div>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Review</p>
                <p className="text-xl font-semibold">{stats.inReview}</p>
              </div>
              <div className="h-4 w-4 rounded-full bg-purple-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Done</p>
                <p className="text-xl font-semibold">{stats.done}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Assigned</p>
                <p className="text-xl font-semibold">{stats.assigned}</p>
              </div>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Flagged</p>
                <p className="text-xl font-semibold">{stats.flagged}</p>
              </div>
              <Flag className="h-4 w-4 text-orange-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-semibold">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={WorkItemStatus.TODO}>To Do</SelectItem>
                <SelectItem value={WorkItemStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={WorkItemStatus.IN_REVIEW}>In Review</SelectItem>
                <SelectItem value={WorkItemStatus.DONE}>Done</SelectItem>
                <SelectItem value={WorkItemStatus.ASSIGNED}>Assigned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value={WorkItemPriority.URGENT}>Urgent</SelectItem>
                <SelectItem value={WorkItemPriority.HIGH}>High</SelectItem>
                <SelectItem value={WorkItemPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={WorkItemPriority.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.documents.map((project) => (
                  <SelectItem key={project.$id} value={project.$id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="board" className="gap-1">
                <LayoutGrid className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredWorkItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No work items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "You don't have any work items assigned yet"}
            </p>
          </div>
        ) : view === "board" ? (
          /* Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 h-full">
            {Object.entries(itemsByStatus).map(([status, items]) => (
              <div key={status} className="flex flex-col bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        status === WorkItemStatus.TODO && "bg-gray-400",
                        status === WorkItemStatus.IN_PROGRESS && "bg-blue-500",
                        status === WorkItemStatus.IN_REVIEW && "bg-purple-500",
                        status === WorkItemStatus.DONE && "bg-green-500",
                        status === WorkItemStatus.ASSIGNED && "bg-red-500"
                      )}
                    />
                    <span className="font-medium text-sm">
                      {status.replace("_", " ")}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {items.map((item) => (
                    <WorkItemCard
                      key={item.$id}
                      workItem={item}
                      workspaceId={workspaceId}
                      projectId={item.projectId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredWorkItems.map((item) => (
              <WorkItemCard
                key={item.$id}
                workItem={item}
                workspaceId={workspaceId}
                projectId={item.projectId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
