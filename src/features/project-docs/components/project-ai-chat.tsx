"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { 
  Loader2, 
  Send, 
  Sparkles, 
  FileText, 
  ListTodo, 
  Copy, 
  Check, 
  Bot,
  X,
  MessageSquare,
  Minimize2,
  Maximize2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useAskProjectQuestion, useGetProjectAIContext } from "../api/use-project-ai";
import { ProjectAIAnswer } from "../types/ai-context";

interface ProjectAIChatProps {
  projectId: string;
  workspaceId: string;
}

const SUGGESTED_QUESTIONS = [
  "What is this project about?",
  "Summarize the PRD",
  "What tasks are in progress?",
  "List high priority tasks",
];

export const ProjectAIChat = ({ projectId, workspaceId }: ProjectAIChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<ProjectAIAnswer[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: contextData, isLoading: isLoadingContext } = useGetProjectAIContext(
    projectId,
    workspaceId
  );
  const { mutate: askQuestion, isPending: isAsking } = useAskProjectQuestion();

  const context = contextData?.data;

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAsk = (questionText?: string) => {
    const q = questionText || question.trim();
    if (!q) return;

    askQuestion(
      { projectId, workspaceId, question: q },
      {
        onSuccess: (response) => {
          if (response.data) {
            setConversation((prev) => [...prev, response.data]);
          }
          setQuestion("");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isAsking) {
      e.preventDefault();
      handleAsk();
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 z-50"
              size="icon"
            >
              <Bot className="h-6 w-6 text-white" />
              {context && (context.summary.totalDocuments > 0 || context.summary.totalTasks > 0) && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Project AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-background border rounded-2xl shadow-2xl transition-all duration-300",
        isExpanded 
          ? "w-[600px] h-[80vh]" 
          : "w-[400px] h-[500px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Project AI</h3>
            <div className="flex items-center gap-2">
              {isLoadingContext ? (
                <span className="text-xs text-muted-foreground">Loading...</span>
              ) : context ? (
                <span className="text-xs text-muted-foreground">
                  {context.summary.totalDocuments} docs • {context.summary.totalTasks} tasks
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation Area */}
      <ScrollArea className="flex-1 p-4">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-medium mb-2">Ask about your project</h4>
            <p className="text-sm text-muted-foreground mb-4">
              I have access to your project documents, tasks, and details.
            </p>
            
            {/* Context badges */}
            {context && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {context.summary.totalDocuments} Documents
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <ListTodo className="h-3 w-3 mr-1" />
                  {context.summary.totalTasks} Tasks
                </Badge>
              </div>
            )}

            {/* Suggested questions */}
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleAsk(q)}
                  disabled={isAsking || isLoadingContext}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.map((item, index) => (
              <div key={index} className="space-y-3">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%]">
                    <p className="text-sm">{item.question}</p>
                  </div>
                </div>

                {/* AI Answer */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeString = String(children).replace(/\n$/, "");
                            const codeId = `code-${index}-${Math.random().toString(36).substr(2, 9)}`;
                            
                            if (match) {
                              return (
                                <div className="relative group my-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleCopyCode(codeString, codeId)}
                                  >
                                    {copiedCode === codeId ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ fontSize: "12px", borderRadius: "8px" }}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                            
                            return (
                              <code className={cn("bg-muted-foreground/20 px-1 py-0.5 rounded text-xs", className)} {...props}>
                                {children}
                              </code>
                            );
                          },
                          p({ children }) {
                            return <p className="text-sm mb-2 last:mb-0">{children}</p>;
                          },
                          ul({ children }) {
                            return <ul className="text-sm list-disc pl-4 mb-2">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="text-sm list-decimal pl-4 mb-2">{children}</ol>;
                          },
                          li({ children }) {
                            return <li className="text-sm mb-1">{children}</li>;
                          },
                          h1({ children }) {
                            return <h1 className="text-base font-bold mb-2">{children}</h1>;
                          },
                          h2({ children }) {
                            return <h2 className="text-sm font-bold mb-2">{children}</h2>;
                          },
                          h3({ children }) {
                            return <h3 className="text-sm font-semibold mb-1">{children}</h3>;
                          },
                        }}
                      >
                        {item.answer}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {item.contextUsed.documentsCount} docs, {item.contextUsed.tasksCount} tasks analyzed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        {conversation.length > 0 && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={clearConversation}
            >
              Clear chat
            </Button>
          </div>
        )}
        <div className="relative">
          <Textarea
            placeholder="Ask about your project..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAsking || isLoadingContext}
            className="min-h-[60px] max-h-[120px] pr-12 resize-none rounded-xl"
            rows={2}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 rounded-lg"
            onClick={() => handleAsk()}
            disabled={!question.trim() || isAsking || isLoadingContext}
          >
            {isAsking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
