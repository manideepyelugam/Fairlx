"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileText, Loader2, RefreshCw, Download, FileDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useGetDocumentation, useGenerateDocumentation } from "../api/use-github";
import { exportToWord, exportToPDF } from "../lib/export-utils";

interface DocumentationViewProps {
  projectId: string;
}

// Helper function to extract specific sections from markdown
const extractSection = (content: string, keywords: string[]): string => {
  const lines = content.split('\n');
  const relevantLines: string[] = [];
  let capturing = false;
  let captureDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeader = line.match(/^#+\s/);
    
    if (isHeader) {
      const headerLevel = line.match(/^#+/)?.[0].length || 0;
      const headerText = line.replace(/^#+\s/, '');
      
      // Check if header matches any keyword
      const matchesKeyword = keywords.some(keyword => 
        headerText.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (matchesKeyword) {
        capturing = true;
        captureDepth = headerLevel;
        relevantLines.push(line);
      } else if (capturing && headerLevel <= captureDepth) {
        // Stop capturing when we hit a header of same or higher level
        capturing = false;
      } else if (capturing) {
        relevantLines.push(line);
      }
    } else if (capturing) {
      relevantLines.push(line);
    }
  }

  return relevantLines.length > 0 
    ? relevantLines.join('\n') 
    : '# No API documentation found\n\nThe documentation doesn\'t contain specific API sections yet.';
};

export const DocumentationView = ({ projectId }: DocumentationViewProps) => {
  const { data: documentation, isLoading } = useGetDocumentation(projectId);
  const { mutate: generateDocumentation, isPending: isGenerating } =
    useGenerateDocumentation();
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = () => {
    generateDocumentation({
      json: { projectId },
    });
  };

  const handleExportWord = async () => {
    if (!documentation?.content) return;
    
    setIsExporting(true);
    try {
      await exportToWord(documentation.content, "repository-documentation");
      toast.success("Documentation exported to Word successfully");
    } catch {
      toast.error("Failed to export documentation to Word");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!documentation?.content) return;
    
    setIsExporting(true);
    try {
      await exportToPDF(documentation.content, "repository-documentation");
      toast.success("Documentation exported to PDF successfully");
    } catch {
      toast.error("Failed to export documentation to PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!documentation) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generate Documentation</CardTitle>
              <CardDescription>
                No documentation available. Click generate to create AI-powered documentation
              </CardDescription>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isGenerating && <FileText className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">Documentation</CardTitle>
              <CardDescription className="mt-1.5">
                AI-generated documentation for your codebase
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportWord}
                disabled={isGenerating || isExporting}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isExporting && <FileDown className="h-4 w-4" />}
                Word
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={isGenerating || isExporting}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isExporting && <Download className="h-4 w-4" />}
                PDF
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isGenerating && <RefreshCw className="h-4 w-4" />}
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="full" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="full" className="text-sm font-medium">
            Full Documentation
          </TabsTrigger>
          <TabsTrigger value="api" className="text-sm font-medium">
            API & Code
          </TabsTrigger>
          <TabsTrigger value="structure" className="text-sm font-medium">
            Structure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="full" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[700px] w-full pr-4">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-base prose-p:leading-7 prose-li:text-base prose-code:text-sm prose-pre:max-w-full prose-pre:overflow-x-auto break-words">
                  <ReactMarkdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="my-4 rounded-lg overflow-hidden border max-w-full">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                fontSize: '0.875rem',
                                padding: '1rem',
                                maxWidth: '100%',
                                overflowX: 'auto',
                              }}
                              wrapLongLines={false}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono break-all" {...props}>
                            {children}
                          </code>
                        );
                      },
                      h1: ({ children }) => (
                        <h1 className="mt-8 mb-4 pb-2 border-b text-3xl font-semibold tracking-tight break-words">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mt-6 mb-3 text-2xl font-semibold tracking-tight break-words">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mt-5 mb-2 text-xl font-semibold tracking-tight break-words">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="break-words">
                          {children}
                        </p>
                      ),
                      li: ({ children }) => (
                        <li className="break-words">
                          {children}
                        </li>
                      ),
                    }}
                  >
                    {documentation.content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">API & Development</CardTitle>
              <CardDescription>
                Key API routes, endpoints, and implementation details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full pr-4">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-code:text-sm prose-pre:max-w-full prose-pre:overflow-x-auto break-words">
                  <ReactMarkdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="my-4 rounded-lg overflow-hidden border max-w-full">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                fontSize: '0.875rem',
                                padding: '1rem',
                                maxWidth: '100%',
                                overflowX: 'auto',
                              }}
                              wrapLongLines={false}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono break-all" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => (
                        <p className="break-words">
                          {children}
                        </p>
                      ),
                      li: ({ children }) => (
                        <li className="break-words">
                          {children}
                        </li>
                      ),
                    }}
                  >
                    {extractSection(documentation.content, ['API', 'Endpoints', 'Development Guide', 'Key Components', 'Configuration'])}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Project Structure</CardTitle>
              <CardDescription>
                Visual representation of your codebase architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tree" className="w-full">
                <TabsList>
                  <TabsTrigger value="tree">File Tree</TabsTrigger>
                  <TabsTrigger value="diagram">Architecture Diagram</TabsTrigger>
                </TabsList>

                <TabsContent value="tree" className="mt-4">
                  {documentation.fileStructure ? (
                    <ScrollArea className="h-[600px] w-full">
                      <div className="border rounded-lg p-6 bg-muted/30 font-mono text-sm">
                        <pre className="whitespace-pre overflow-x-auto">
                          {documentation.fileStructure}
                        </pre>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      No file tree available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="diagram" className="mt-4">
                  {documentation.mermaidDiagram ? (
                    <ScrollArea className="h-[600px] w-full">
                      <div className="border rounded-lg p-6 bg-muted/30">
                        <pre className="text-sm font-mono whitespace-pre overflow-x-auto">
                          {documentation.mermaidDiagram}
                        </pre>
                        <div className="mt-6 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Copy this Mermaid code to{" "}
                            <a
                              href="https://mermaid.live"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-medium"
                            >
                              mermaid.live
                            </a>{" "}
                            to visualize the diagram
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      No architecture diagram available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
