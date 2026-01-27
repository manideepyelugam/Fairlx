"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Loader2, Send, Sparkles, FileCode, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { useAskQuestion } from "../api/use-github";

interface CodebaseQAProps {
  projectId: string;
  commitsCount?: number;
}

interface QAData {
  question: string;
  answer: string;
  timestamp: string;
}

export const CodebaseQA = ({ projectId, commitsCount = 0 }: CodebaseQAProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QAData | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { mutate: askQuestion, isPending: isAsking } = useAskQuestion();

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Extract file references from markdown
  const extractFileReferences = (markdown: string): string[] => {
    const fileRegex = /`([^`]+\.(tsx?|jsx?|css|json|md|ts|js))`/g;
    const matches = [...markdown.matchAll(fileRegex)];
    return [...new Set(matches.map(m => m[1]))];
  };

  const handleAsk = () => {
    if (!question.trim()) return;

    askQuestion(
      {
        json: { projectId, question: question.trim() },
      },
      {
        onSuccess: (response) => {
          if (response.data) {
            setAnswer(response.data);
            setShowAnswerModal(true);
          }
          setQuestion("");
        },
      }
    );
  };

  // Save/Close actions intentionally removed per UX request

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isAsking) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <>
      <div className=" p-6 rounded-lg border">
        <div className="pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ask a Question</h2>
              <p className="text-sm text-muted-foreground">
                Ask anything about your codebase and get AI-powered answers
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-blue-700" />
              <span className="text-blue-600">AI-Powered</span>
              <span className="text-xs">•</span>
              <p className="text-xs text-muted-foreground">
                {commitsCount > 0 ? `${commitsCount} commits analyzed` : 'Analyzing codebase...'}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 relative">
          <Textarea
            placeholder="e.g., How does the authentication system work? What are the main API endpoints?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] shadow-none resize-none"
            disabled={isAsking}
          />
          <Button className="absolute top-11 right-2" size={"sm"} onClick={handleAsk} disabled={isAsking || !question.trim()}>
            {isAsking && <Loader2 className=" h-2 w-2 animate-spin" />}
            {!isAsking && <Send className=" h-2 w-2" />}

          </Button>
        </div>
      </div>





      {/* Answer Modal */}
      <Dialog open={showAnswerModal} onOpenChange={setShowAnswerModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold mb-2">
                  {answer?.question}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {answer?.timestamp && new Date(answer.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* File References Tabs */}
          {answer && extractFileReferences(answer.answer).length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b overflow-x-auto">
              <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex gap-1 flex-wrap">
                {extractFileReferences(answer.answer).map((file, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-mono bg-muted/50 hover:bg-muted"
                  >
                    {file}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <ScrollArea className="max-h-[calc(90vh-250px)] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

                    return !inline && match ? (
                      <div className="relative group rounded-lg overflow-hidden border border-border bg-[#1e1e1e] my-4">
                        {/* Code Editor Header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-border">
                          <span className="text-xs text-muted-foreground font-mono">
                            {match[1]}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 bg-primary text-primary-foreground transition-opacity font-medium"
                            onClick={() => handleCopyCode(codeString, codeId)}
                          >
                            {copiedCode === codeId ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                <span className="text-xs">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="text-xs">Copy</span>
                              </>
                            )}
                          </Button>
                        </div>
                        {/* Code Content */}
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: '#1e1e1e',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                          }}
                          showLineNumbers={true}
                          wrapLines={true}
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mt-6 mb-3 pb-2 border-b">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 my-3 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 my-3 space-y-1">{children}</ol>
                  ),
                  p: ({ children }) => (
                    <p className="my-2 leading-relaxed">{children}</p>
                  ),
                }}
              >
                {answer?.answer || ""}
              </ReactMarkdown>
            </div>
          </ScrollArea>

          {/* Footer removed: Close and Save Answer options disabled per user's request */}
        </DialogContent>
      </Dialog>
    </>
  );
};
