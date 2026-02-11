"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Unlink,
  ExternalLink,
  Search,
  MoreHorizontal,
  FolderKanban,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useConfirm } from "@/hooks/use-confirm";
import { useGetProgramProjects } from "../api/use-get-program-projects";
import { useGetAvailableProjects } from "../api/use-get-available-projects";
import { useLinkProjectToProgram } from "../api/use-link-project-to-program";
import { useUnlinkProjectFromProgram } from "../api/use-unlink-project-from-program";
import { LinkedProject } from "../types";

interface ProgramProjectsListProps {
  programId: string;
  workspaceId: string;
  canManage?: boolean;
}

const PROJECT_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800",
  COMPLETED: "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-800",
  ARCHIVED: "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-700",
  ON_HOLD: "text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-800",
};

export const ProgramProjectsList = ({ programId, workspaceId, canManage = false }: ProgramProjectsListProps) => {
  const [search, setSearch] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [availSearch, setAvailSearch] = useState("");

  const { data: projData, isLoading } = useGetProgramProjects({ programId });
  const { data: availData, isLoading: isLoadingAvail } = useGetAvailableProjects({ programId });
  const { mutate: linkProject, isPending: isLinking } = useLinkProjectToProgram();
  const { mutate: unlinkProject, isPending: isUnlinking } = useUnlinkProjectFromProgram();

  const [UnlinkDialog, confirmUnlink] = useConfirm("Unlink Project", "Remove this project from the program? The project itself won't be deleted.", "destructive");

  const projects = projData?.data?.documents || [];
  const available = useMemo(() => {
    const list = availData?.data?.documents?.filter((p: { isLinked: boolean }) => !p.isLinked) || [];
    if (!availSearch) return list;
    return list.filter((p: { name: string; key?: string }) =>
      p.name.toLowerCase().includes(availSearch.toLowerCase()) || p.key?.toLowerCase().includes(availSearch.toLowerCase())
    );
  }, [availData?.data?.documents, availSearch]);

  const filtered = projects.filter((p: LinkedProject) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.key?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = (pid: string) => linkProject({ programId, projectId: pid }, { onSuccess: () => { setLinkOpen(false); setAvailSearch(""); } });
  const handleUnlink = async (pid: string) => { const ok = await confirmUnlink(); if (ok) unlinkProject({ programId, projectId: pid }); };

  if (isLoading) return <ProjectsSkeleton />;

  return (
    <>
      <UnlinkDialog />
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Linked Projects
              <Badge variant="secondary" className="ml-1 tabular-nums">{projects.length}</Badge>
            </h2>
            <p className="text-sm text-muted-foreground">Projects tracked as part of this program</p>
          </div>
          {canManage && (
            <Dialog open={linkOpen} onOpenChange={(o) => { setLinkOpen(o); if (!o) setAvailSearch(""); }}>
              <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Link Project</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Link Project</DialogTitle>
                  <DialogDescription>Select a workspace project to link. Projects can only belong to one program.</DialogDescription>
                </DialogHeader>
                {isLoadingAvail ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : availData?.data?.documents?.filter((p: { isLinked: boolean }) => !p.isLinked).length === 0 ? (
                  <div className="flex flex-col items-center py-10"><FolderKanban className="h-10 w-10 text-muted-foreground/40 mb-3" /><p className="text-sm text-muted-foreground">No available projects to link</p></div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search projects..." value={availSearch} onChange={(e) => setAvailSearch(e.target.value)} className="pl-9" /></div>
                    <ScrollArea className="h-[280px]">
                      {available.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No projects found</p> : (
                        <div className="space-y-1">
                          {available.map((p: { $id: string; name: string; key?: string; imageUrl?: string }) => (
                            <button key={p.$id} onClick={() => handleLink(p.$id)} disabled={isLinking} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50">
                              {p.imageUrl ? <Image src={p.imageUrl} alt={p.name} width={32} height={32} className="h-8 w-8 rounded-md object-cover" /> : <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-semibold">{p.name[0]?.toUpperCase()}</div>}
                              <div className="flex-1 min-w-0"><p className="font-medium truncate">{p.name}</p>{p.key && <p className="text-xs text-muted-foreground">{p.key}</p>}</div>
                              {isLinking && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        {projects.length > 0 && (
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filter projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" /></div>
        )}

        {/* Empty */}
        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><FolderKanban className="h-7 w-7 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold mb-1">No projects linked</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">Link workspace projects to track them under this program.</p>
              {canManage && <Button size="sm" onClick={() => setLinkOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Link First Project</Button>}
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10"><Search className="h-8 w-8 text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">No projects match &quot;{search}&quot;</p></div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((project: LinkedProject) => (
              <Card key={project.$id} className="group transition-all hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {project.imageUrl ? (
                      <Image src={project.imageUrl} alt={project.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><span className="text-sm font-bold">{project.name[0]?.toUpperCase()}</span></div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{project.name}</h4>
                        {project.key && <Badge variant="outline" className="text-[11px] px-1.5 py-0">{project.key}</Badge>}
                        <Badge variant="outline" className={cn("text-[11px] px-1.5 py-0", PROJECT_STATUS_STYLE[project.status] || PROJECT_STATUS_STYLE.ACTIVE)}>{project.status?.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                          <Progress value={project.progress} className="h-1.5 flex-1" />
                          <span className="text-xs font-semibold tabular-nums w-9 text-right">{project.progress}%</span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{project.completedTaskCount}/{project.taskCount} tasks</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><a href={`/workspaces/${workspaceId}/projects/${project.$id}`}><ExternalLink className="h-4 w-4 mr-2" />Open Project</a></DropdownMenuItem>
                        {canManage && <DropdownMenuItem onClick={() => handleUnlink(project.$id)} className="text-destructive" disabled={isUnlinking}><Unlink className="h-4 w-4 mr-2" />Unlink</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

/* ─── Skeleton ────────────────────────────────────────────────────── */
function ProjectsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><Skeleton className="h-6 w-40" /><Skeleton className="h-9 w-28" /></div>
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    </div>
  );
}
