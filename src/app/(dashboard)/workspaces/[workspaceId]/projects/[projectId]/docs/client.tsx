"use client";

import { 
  BookOpen, 
  FolderOpen,
  Sparkles,
  FileText,
} from "lucide-react";

import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { DocumentList } from "@/features/project-docs/components";

export const ProjectDocsClient = () => {
  const projectId = useProjectId();
  const workspaceId = useWorkspaceId();
  
  const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });

  if (isLoadingProject) {
    return <PageLoader />;
  }

  if (!project) {
    return <PageError message="Project not found." />;
  }

  return (
    <div className="flex flex-col  gap-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
         
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight dark:text-white">Project Documents</h1>
          <span className="text-sm font-light text-gray-400">•</span>
          <span className="text-sm tracking-normal font-light text-gray-500 dark:text-gray-400">{project.name}</span>
        </div>
        <p className="text-sm font-normal text-gray-500 dark:text-gray-400 ">
          Manage PRD, FRD, and other project documentation
        </p>
      </div>

      {/* Quick Info Pills */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-4 px-6 py-3 rounded-md bg-[#1269d6]/5 border border-[#1269d6]/10">
          <BookOpen className="h-5 w-5 text-[#1269d6]" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Product Requirements</span>
            <span className="text-[10px] font-light text-gray-500 dark:text-gray-400">PRD, features, user stories</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-md bg-[#1269d6]/5 border border-[#1269d6]/10">
          <FolderOpen className="h-5 w-5 text-[#1269d6]" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Functional Specs</span>
            <span className="text-[10px] font-light text-gray-500 dark:text-gray-400">FRD, technical specs</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-md bg-[#1269d6]/5 border border-[#1269d6]/10">
          <Sparkles className="h-5 w-5 text-[#1269d6]" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">AI Integration</span>
            <span className="text-[10px] font-light text-gray-500 dark:text-gray-400">Auto-analyzed by AI</span>
          </div>
        </div>
      </div>

      {/* Document List */}
      <DocumentList projectId={projectId} workspaceId={workspaceId} />
    </div>
  );
};
