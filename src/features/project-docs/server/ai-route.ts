import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Query, Storage as StorageType } from "node-appwrite";

import { sessionMiddleware } from "@/lib/session-middleware";
import { 
  DATABASE_ID, 
  PROJECT_DOCS_ID, 
  PROJECT_DOCS_BUCKET_ID, 
  PROJECTS_ID, 
  TASKS_ID,
  MEMBERS_ID,
} from "@/config";
import { getMember } from "@/features/members/utils";
import { Member } from "@/features/members/types";
import { ProjectDocsAI } from "../lib/project-docs-ai";
import { ProjectDocument } from "../types";
import { Task } from "@/features/tasks/types";
import { 
  ProjectAIContext, 
  DocumentContext, 
  TaskContext,
  MemberContext,
  ProjectAIAnswer 
} from "../types/ai-context";

// Schema for asking questions
const askProjectQuestionSchema = z.object({
  projectId: z.string(),
  workspaceId: z.string(),
  question: z.string().min(3).max(2000),
});

// Schema for getting AI context
const getProjectAIContextSchema = z.object({
  projectId: z.string(),
  workspaceId: z.string(),
});

/**
 * Extract text content from a document URL
 * For PDFs and text files, attempts to read the content
 */
async function extractDocumentText(
  storage: StorageType,
  bucketId: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  try {
    // For now, we'll fetch the raw file content
    // In production, you'd want to use a PDF parsing library like pdf-parse
    const fileBuffer = await storage.getFileDownload(bucketId, fileId);
    
    // If it's a text-based file, convert to string
    if (
      mimeType.includes("text/") || 
      mimeType.includes("application/json") ||
      mimeType.includes("application/xml")
    ) {
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(fileBuffer);
    }
    
    // For PDFs and other binary formats, we'd need specialized parsing
    // For now, return a placeholder indicating the document exists
    if (mimeType.includes("pdf")) {
      return "[PDF Document - Content available for AI analysis]";
    }
    
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return "[Word Document - Content available for AI analysis]";
    }
    
    return "[Document content not extractable]";
  } catch (error) {
    console.error("Error extracting document text:", error);
    return "[Failed to extract document content]";
  }
}

const app = new Hono()
  // Get AI context for a project
  .get(
    "/context",
    sessionMiddleware,
    zValidator("query", getProjectAIContextSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const databases = c.get("databases");
        const storage = c.get("storage");
        const { projectId, workspaceId } = c.req.valid("query");

        // Verify workspace membership
        const member = await getMember({
          databases,
          workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Get project details
        const project = await databases.getDocument(
          DATABASE_ID,
          PROJECTS_ID,
          projectId
        );

        // Get project documents (non-archived)
        const docsResponse = await databases.listDocuments<ProjectDocument>(
          DATABASE_ID,
          PROJECT_DOCS_ID,
          [
            Query.equal("projectId", projectId),
            Query.equal("workspaceId", workspaceId),
            Query.equal("isArchived", false),
            Query.limit(50), // Limit for performance
          ]
        );

        // Get project tasks
        const tasksResponse = await databases.listDocuments<Task>(
          DATABASE_ID,
          TASKS_ID,
          [
            Query.equal("projectId", projectId),
            Query.equal("workspaceId", workspaceId),
            Query.limit(100), // Limit for performance
          ]
        );

        // Get workspace members
        const membersResponse = await databases.listDocuments<Member>(
          DATABASE_ID,
          MEMBERS_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.limit(100),
          ]
        );

        // Create a map of member userId to member details
        const memberMap = new Map<string, Member>();
        membersResponse.documents.forEach((m) => {
          memberMap.set(m.userId, m);
        });

        // Count tasks per assignee
        const tasksByAssignee: Record<string, number> = {};
        tasksResponse.documents.forEach((task) => {
          if (task.assigneeId) {
            tasksByAssignee[task.assigneeId] = (tasksByAssignee[task.assigneeId] || 0) + 1;
          }
        });

        // Process members with task counts
        const members: MemberContext[] = membersResponse.documents.map((m) => ({
          id: m.$id,
          userId: m.userId,
          name: m.name || m.email || "Unknown Member",
          email: m.email || undefined,
          role: m.role,
          tasksAssigned: tasksByAssignee[m.userId] || 0,
        }));

        // Process documents with extracted text
        const documents: DocumentContext[] = await Promise.all(
          docsResponse.documents.map(async (doc) => {
            const extractedText = await extractDocumentText(
              storage,
              PROJECT_DOCS_BUCKET_ID,
              doc.fileId,
              doc.mimeType
            );

            return {
              id: doc.$id,
              name: doc.name,
              category: doc.category,
              description: doc.description || undefined,
              tags: doc.tags || undefined,
              extractedText,
              createdAt: doc.$createdAt,
            };
          })
        );

        // Process tasks with assignee names
        const tasks: TaskContext[] = tasksResponse.documents.map((task) => {
          const assignee = task.assigneeId ? memberMap.get(task.assigneeId) : undefined;
          return {
            id: task.$id,
            name: task.name,
            status: task.status,
            priority: task.priority || undefined,
            description: task.description || undefined,
            assigneeId: task.assigneeId || undefined,
            assigneeName: assignee ? (assignee.name || assignee.email || "Unknown") : undefined,
            dueDate: task.dueDate || undefined,
            labels: task.labels || undefined,
          };
        });

        // Calculate summary stats
        const tasksByStatus: Record<string, number> = {};
        tasks.forEach((task) => {
          tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
        });

        const documentCategories = [...new Set(documents.map((d) => d.category))];

        const context: ProjectAIContext = {
          project: {
            id: project.$id,
            name: project.name,
            workspaceId: project.workspaceId,
            createdAt: project.$createdAt,
          },
          documents,
          tasks,
          members,
          summary: {
            totalDocuments: documents.length,
            totalTasks: tasks.length,
            totalMembers: members.length,
            tasksByStatus,
            tasksByAssignee,
            documentCategories,
          },
        };

        return c.json({ data: context });
      } catch (error) {
        console.error("Error fetching AI context:", error);
        return c.json({ error: "Failed to fetch AI context" }, 500);
      }
    }
  )
  // Ask a question about the project using AI
  .post(
    "/ask",
    sessionMiddleware,
    zValidator("json", askProjectQuestionSchema),
    async (c) => {
      try {
        const user = c.get("user");
        const databases = c.get("databases");
        const storage = c.get("storage");
        const { projectId, workspaceId, question } = c.req.valid("json");

        // Verify workspace membership
        const member = await getMember({
          databases,
          workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Initialize Project Docs AI
        const projectDocsAI = new ProjectDocsAI();

        if (!projectDocsAI.isConfigured()) {
          return c.json(
            { error: "AI features require GEMINI_API_KEY to be configured" },
            400
          );
        }

        // Get project details
        const project = await databases.getDocument(
          DATABASE_ID,
          PROJECTS_ID,
          projectId
        );

        // Get project documents (non-archived)
        const docsResponse = await databases.listDocuments<ProjectDocument>(
          DATABASE_ID,
          PROJECT_DOCS_ID,
          [
            Query.equal("projectId", projectId),
            Query.equal("workspaceId", workspaceId),
            Query.equal("isArchived", false),
            Query.limit(30), // Limit for AI context
          ]
        );

        // Get project tasks
        const tasksResponse = await databases.listDocuments<Task>(
          DATABASE_ID,
          TASKS_ID,
          [
            Query.equal("projectId", projectId),
            Query.equal("workspaceId", workspaceId),
            Query.limit(50), // Limit for AI context
          ]
        );

        // Get workspace members
        const membersResponse = await databases.listDocuments<Member>(
          DATABASE_ID,
          MEMBERS_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.limit(100),
          ]
        );

        // Create a map of member userId to member details
        const memberMap = new Map<string, Member>();
        membersResponse.documents.forEach((m) => {
          memberMap.set(m.userId, m);
        });

        // Process documents with extracted text
        const documentContexts: string[] = await Promise.all(
          docsResponse.documents.map(async (doc) => {
            const extractedText = await extractDocumentText(
              storage,
              PROJECT_DOCS_BUCKET_ID,
              doc.fileId,
              doc.mimeType
            );

            return `
## Document: ${doc.name}
**Category:** ${doc.category}
**Description:** ${doc.description || "No description"}
**Tags:** ${doc.tags?.join(", ") || "None"}
**Content:**
${extractedText.slice(0, 5000)}
`;
          })
        );

        // Format tasks context with assignee names
        const taskContexts = tasksResponse.documents.map((task) => {
          const assignee = task.assigneeId ? memberMap.get(task.assigneeId) : undefined;
          const assigneeName = assignee ? (assignee.name || assignee.email || "Unknown") : "Unassigned";
          return `- **${task.name}** [${task.status}] ${task.priority ? `(${task.priority})` : ""} | Assigned to: ${assigneeName} - ${task.description?.slice(0, 200) || "No description"}`;
        }).join("\n");

        // Format members context
        const memberContexts = membersResponse.documents.map((m) => {
          const taskCount = tasksResponse.documents.filter(t => t.assigneeId === m.userId).length;
          return `- **${m.name || m.email || "Unknown"}** (${m.role}) - ${taskCount} task(s) assigned`;
        }).join("\n");

        // Build the comprehensive prompt
        const prompt = `You are an AI assistant with deep knowledge of this specific project. Answer questions based on the project context provided below.

## Project Information
**Name:** ${project.name}
**Project ID:** ${projectId}
**Created:** ${new Date(project.$createdAt).toLocaleDateString()}

## Project Statistics
- **Total Documents:** ${docsResponse.documents.length}
- **Total Tasks:** ${tasksResponse.documents.length}
- **Team Members:** ${membersResponse.documents.length}
- **Document Categories:** ${[...new Set(docsResponse.documents.map(d => d.category))].join(", ") || "None"}

## Team Members
${memberContexts || "No team members found."}

## Project Documents
${documentContexts.join("\n---\n") || "No documents uploaded yet."}

## Project Tasks
${taskContexts || "No tasks created yet."}

---

## User Question
${question}

---

## Instructions
1. Answer the question based on the project context above
2. Reference specific documents, tasks, or details when relevant
3. If the question cannot be answered from the context, say so clearly
4. Be helpful and provide actionable insights when possible
5. Format your response in clear Markdown with headings and bullet points where appropriate

Provide a comprehensive, helpful answer:`;

        // Call Project Docs AI
        const answer = await projectDocsAI.answerProjectQuestion(prompt);

        const response: ProjectAIAnswer = {
          question,
          answer,
          timestamp: new Date().toISOString(),
          contextUsed: {
            documentsCount: docsResponse.documents.length,
            tasksCount: tasksResponse.documents.length,
            membersCount: membersResponse.documents.length,
            categories: [...new Set(docsResponse.documents.map(d => d.category))],
          },
        };

        return c.json({ data: response });
      } catch (error) {
        console.error("Error answering question:", error);
        return c.json({ 
          error: error instanceof Error ? error.message : "Failed to process question" 
        }, 500);
      }
    }
  );

export default app;
