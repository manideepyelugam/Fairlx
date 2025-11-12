"use client";

import { Plus, MoreVertical, Pencil, Trash2, FolderKanban, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetPrograms } from "@/features/programs/api/use-get-programs";
import { useDeleteProgram } from "@/features/programs/api/use-delete-program";
import { useCreateProgramModal } from "@/features/programs/hooks/use-create-program-modal";
import { useEditProgramModal } from "@/features/programs/hooks/use-edit-program-modal";
import { useProgramId } from "@/features/programs/hooks/use-program-id";
import { CreateProgramModal } from "@/features/programs/components/create-program-modal";
import { EditProgramModal } from "@/features/programs/components/edit-program-modal";
import { ProgramStatus } from "@/features/programs/types";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";

const getStatusColor = (status: ProgramStatus) => {
  switch (status) {
    case ProgramStatus.ACTIVE:
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case ProgramStatus.PLANNING:
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case ProgramStatus.ON_HOLD:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case ProgramStatus.COMPLETED:
      return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
    case ProgramStatus.CANCELLED:
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default:
      return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
  }
};

const getStatusLabel = (status: ProgramStatus) => {
  return status.replace(/_/g, " ");
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export const ProgramsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: programs, isLoading } = useGetPrograms({ workspaceId });
  const { open: openCreate } = useCreateProgramModal();
  const { open: openEdit } = useEditProgramModal();
  const [, setProgramId] = useProgramId();
  const { mutate: deleteProgram } = useDeleteProgram();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Program",
    "This action cannot be undone. All teams associated with this program will be unlinked.",
    "destructive"
  );

  const handleEdit = (programId: string) => {
    setProgramId(programId);
    openEdit();
  };

  const handleDelete = async (programId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;

    deleteProgram({ param: { programId } });
  };

  return (
    <div className="w-full flex flex-col gap-y-6">
      <DeleteDialog />
      <CreateProgramModal />
      <EditProgramModal />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground mt-1">
            Strategic initiatives that drive your organization forward
          </p>
        </div>
        <Button onClick={openCreate} size="default" className="gap-2">
          <Plus className="size-4" />
          Create Program
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : programs?.documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No programs yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Create your first program to organize strategic initiatives across your workspace
            </p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              Create Your First Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs?.documents.map((program) => (
            <Card 
              key={program.$id} 
              className="group hover:shadow-md transition-all duration-200 overflow-hidden border-border/40 hover:border-border"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="size-12 rounded-lg border">
                      {program.imageUrl ? (
                        <AvatarImage src={program.imageUrl} alt={program.name} />
                      ) : (
                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                          {program.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-semibold text-base truncate">
                        {program.name}
                      </h3>
                      <Badge className={cn("text-xs font-normal", getStatusColor(program.status))}>
                        {getStatusLabel(program.status)}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="size-8 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(program.$id)}>
                        <Pencil className="size-4 mr-2" />
                        Edit Program
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(program.$id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Program
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {program.description || "No description provided"}
                </p>
                {(program.startDate || program.endDate) && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {program.startDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span className="font-medium">Start:</span>
                        <span>{formatDate(program.startDate)}</span>
                      </div>
                    )}
                    {program.endDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span className="font-medium">End:</span>
                        <span>{formatDate(program.endDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-4 border-t bg-muted/5">
                <Link 
                  href={`/workspaces/${workspaceId}/programs/${program.$id}`}
                  className="flex items-center justify-between w-full group/link"
                >
                  <span className="text-sm text-muted-foreground">View program details</span>
                  <ArrowRight className="size-4 text-muted-foreground group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
