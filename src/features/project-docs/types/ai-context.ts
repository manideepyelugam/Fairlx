// Types for Project AI Context
// This provides comprehensive project context for AI-powered assistance

export interface ProjectAIContext {
  project: {
    id: string;
    name: string;
    workspaceId: string;
    createdAt: string;
  };
  documents: DocumentContext[];
  tasks: TaskContext[];
  summary: {
    totalDocuments: number;
    totalTasks: number;
    tasksByStatus: Record<string, number>;
    documentCategories: string[];
  };
}

export interface DocumentContext {
  id: string;
  name: string;
  category: string;
  description?: string;
  tags?: string[];
  extractedText?: string; // Extracted text from PDF/documents
  createdAt: string;
}

export interface TaskContext {
  id: string;
  name: string;
  status: string;
  priority?: string;
  description?: string;
  assignees?: string[];
  dueDate?: string;
  labels?: string[];
}

export interface ProjectAIQuestion {
  projectId: string;
  workspaceId: string;
  question: string;
}

export interface ProjectAIAnswer {
  question: string;
  answer: string;
  timestamp: string;
  contextUsed: {
    documentsCount: number;
    tasksCount: number;
    categories: string[];
  };
}
