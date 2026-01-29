"use client";

import { useState, useCallback, useMemo } from "react";
import { FolderKanban, Check, ChevronsUpDown, Plus, X, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetPrograms } from "../api/use-get-programs";
import { useCreateProgramModal } from "../hooks/use-create-program-modal";
import { Program, ProgramStatus } from "../types";

interface ProgramSelectorProps {
  workspaceId: string;
  value?: string;
  onChange?: (programId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  showCreateButton?: boolean;
  className?: string;
  triggerClassName?: string;
}

const statusColors: Record<ProgramStatus, string> = {
  [ProgramStatus.PLANNING]: "bg-gray-400",
  [ProgramStatus.ACTIVE]: "bg-blue-500",
  [ProgramStatus.ON_HOLD]: "bg-amber-500",
  [ProgramStatus.COMPLETED]: "bg-emerald-500",
  [ProgramStatus.CANCELLED]: "bg-red-500",
};

export const ProgramSelector = ({
  workspaceId,
  value,
  onChange,
  placeholder = "Select program...",
  disabled = false,
  allowClear = true,
  showCreateButton = true,
  className,
  triggerClassName,
}: ProgramSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { open: openCreateModal } = useCreateProgramModal();

  const { data: programs, isLoading } = useGetPrograms({ workspaceId });

  const selectedProgram = programs?.documents?.find(
    (program: Program) => program.$id === value
  );

  const filteredPrograms = useMemo(() => {
    if (!programs?.documents) return [];
    if (!searchQuery) return programs.documents;
    return programs.documents.filter((program: Program) =>
      program.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [programs?.documents, searchQuery]);

  const handleSelect = useCallback(
    (programId: string) => {
      if (value === programId && allowClear) {
        onChange?.(undefined);
      } else {
        onChange?.(programId);
      }
      setOpen(false);
      setSearchQuery("");
    },
    [value, allowClear, onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(undefined);
    },
    [onChange]
  );

  const handleCreateNew = useCallback(() => {
    setOpen(false);
    setSearchQuery("");
    openCreateModal();
  }, [openCreateModal]);

  if (isLoading) {
    return <Skeleton className={cn("h-10 w-full", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSearchQuery("");
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !selectedProgram && "text-muted-foreground",
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedProgram ? (
              <>
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    statusColors[selectedProgram.status as ProgramStatus] || "bg-gray-400"
                  )}
                />
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{selectedProgram.name}</span>
              </>
            ) : (
              <>
                <FolderKanban className="h-4 w-4" />
                <span>{placeholder}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedProgram && allowClear && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[300px] p-0", className)} align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <ScrollArea className="max-h-[300px]">
          {filteredPrograms.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No programs found.
            </div>
          ) : (
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Programs
              </div>
              {filteredPrograms.map((program: Program) => (
                <button
                  key={program.$id}
                  onClick={() => handleSelect(program.$id)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === program.$id && "bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      statusColors[program.status as ProgramStatus] || "bg-gray-400"
                    )}
                  />
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-left">{program.name}</span>
                  {value === program.$id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
          {showCreateButton && (
            <>
              <Separator />
              <div className="p-1">
                <button
                  onClick={handleCreateNew}
                  className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none text-primary hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create new program</span>
                </button>
              </div>
            </>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

// Filter variant for use in project lists/filters
interface ProgramFilterProps {
  workspaceId: string;
  value?: string | null;
  onChange?: (programId: string | null) => void;
  className?: string;
}

export const ProgramFilter = ({
  workspaceId,
  value,
  onChange,
  className,
}: ProgramFilterProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: programs, isLoading } = useGetPrograms({ workspaceId });

  const selectedProgram = programs?.documents?.find(
    (program: Program) => program.$id === value
  );

  const filteredPrograms = useMemo(() => {
    if (!programs?.documents) return [];
    if (!searchQuery) return programs.documents;
    return programs.documents.filter((program: Program) =>
      program.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [programs?.documents, searchQuery]);

  if (isLoading) {
    return <Skeleton className={cn("h-8 w-[150px]", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSearchQuery("");
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 border-dashed",
            selectedProgram && "border-solid",
            className
          )}
        >
          <FolderKanban className="mr-2 h-4 w-4" />
          {selectedProgram ? (
            <>
              {selectedProgram.name}
              <X
                className="ml-2 h-3 w-3 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(null);
                }}
              />
            </>
          ) : (
            "Program"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full border-0 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <ScrollArea className="max-h-[200px]">
          {filteredPrograms.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No programs found.
            </div>
          ) : (
            <div className="p-1">
              {filteredPrograms.map((program: Program) => (
                <button
                  key={program.$id}
                  onClick={() => {
                    onChange?.(program.$id === value ? null : program.$id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === program.$id && "bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "mr-2 h-2 w-2 rounded-full",
                      statusColors[program.status as ProgramStatus] || "bg-gray-400"
                    )}
                  />
                  <span className="flex-1 truncate text-left">{program.name}</span>
                  {value === program.$id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
