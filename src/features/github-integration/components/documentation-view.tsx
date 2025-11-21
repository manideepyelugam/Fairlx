"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileText, Loader2, RefreshCw, Download, FileDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!documentation) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold mb-1">Generate Documentation</CardTitle>
          <CardDescription className="text-xs text-center mb-6 max-w-md">
            No documentation available. Click generate to create AI-powered documentation from your repository.
          </CardDescription>
          <Button onClick={handleGenerate} disabled={isGenerating} size="xs" className="h-7 px-3">
            {isGenerating && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            {!isGenerating && <FileText className="mr-1.5 h-3 w-3" />}
            <span className="text-xs">Generate Documentation</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 ">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">AI Documentation</h2>
            <p className="text-xs text-muted-foreground">Generated from your codebase</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            onClick={handleExportWord}
            disabled={isGenerating || isExporting}
            variant="outline"
            size="xs"
            className="h-7 px-2 gap-1.5"
          >
            {isExporting && <Loader2 className="h-3 w-3 animate-spin" />}
            {!isExporting && <FileDown className="h-3 w-3" />}
            <span className="text-xs">Word</span>
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isGenerating || isExporting}
            variant="outline"
            size="xs"
            className="h-7 px-2 gap-1.5"
          >
            {isExporting && <Loader2 className="h-3 w-3 animate-spin" />}
            {!isExporting && <Download className="h-3 w-3" />}
            <span className="text-xs">PDF</span>
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="outline"
            size="xs"
            className="h-7 px-2 gap-1.5"
          >
            {isGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
            {!isGenerating && <RefreshCw className="h-3 w-3" />}
            <span className="text-xs">Regenerate</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="full" className="w-full">
     <TabsList className="grid w-1/2 grid-cols-3 mt-6 h-8 p-0.5">
  <TabsTrigger
    value="full"
    className="text-xs font-medium h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
  >
    Full Docs
  </TabsTrigger>

  <TabsTrigger
    value="api"
    className="text-xs font-medium h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
  >
    API & Code
  </TabsTrigger>

  <TabsTrigger
    value="structure"
    className="text-xs font-medium h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
  >
    Structure
  </TabsTrigger>
</TabsList>


        <TabsContent value="full" className="mt-3">
          <Card className="border p-4 shadow-sm">
            <CardContent >
              <ScrollArea className="h-[calc(100vh-240px)] w-full pr-3">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h1:mb-3 prose-h2:text-lg prose-h2:mb-2 prose-h3:text-base prose-h3:mb-2 prose-h4:text-sm prose-h4:mb-1.5 prose-p:text-sm prose-p:leading-6 prose-p:mb-3 prose-li:text-sm prose-code:text-xs prose-pre:max-w-full prose-pre:overflow-x-auto prose-ul:my-2 prose-ol:my-2 break-words">
                  <ReactMarkdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="my-3 rounded-md overflow-hidden border shadow-sm max-w-full">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                fontSize: '0.75rem',
                                padding: '0.75rem',
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
                          <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono break-all" {...props}>
                            {children}
                          </code>
                        );
                      },
                      h1: ({ children }) => (
                        <h1 className="mt-6 mb-3 pb-2 border-b text-xl font-semibold tracking-tight break-words">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mt-5 mb-2 text-lg font-semibold tracking-tight break-words">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mt-4 mb-2 text-base font-semibold tracking-tight break-words">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm leading-6 break-words">
                          {children}
                        </p>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm break-words">
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

        <TabsContent value="api" className="mt-3">
          <Card className="border shadow-sm p-4">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">API & Development</CardTitle>
              <CardDescription className="text-xs">
                Key API routes, endpoints, and implementation details
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ScrollArea className="h-[calc(100vh-280px)] w-full pr-3">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-p:text-sm prose-p:leading-6 prose-li:text-sm prose-code:text-xs prose-pre:max-w-full prose-pre:overflow-x-auto break-words">
                  <ReactMarkdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="my-3 rounded-md overflow-hidden border shadow-sm max-w-full">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                fontSize: '0.75rem',
                                padding: '0.75rem',
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
                          <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono break-all" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => (
                        <p className="text-sm leading-6 break-words">
                          {children}
                        </p>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm break-words">
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

        <TabsContent value="structure" className="mt-3">
          <Card className="border p-4 shadow-sm">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">Project Structure</CardTitle>
              <CardDescription className="text-xs">
                Visual representation of your codebase architecture
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Tabs defaultValue="tree" className="w-full">
                <TabsList className="h-8 p-0.5">
                  <TabsTrigger value="tree" className="text-xs h-7">File Tree</TabsTrigger>
                  <TabsTrigger value="diagram" className="text-xs h-7">Architecture</TabsTrigger>
                </TabsList>

                <TabsContent value="tree" className="mt-3">
                  {documentation.fileStructure ? (
                    <ScrollArea className="h-[calc(100vh-340px)] w-full">
                      <div className="border rounded-md p-3 bg-muted/30 font-mono text-xs">
                        <pre className="whitespace-pre overflow-x-auto text-xs">
                          {documentation.fileStructure}
                        </pre>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-12 text-xs">
                      No file tree available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="diagram" className="mt-3">
                  {documentation.mermaidDiagram ? (
                    <ScrollArea className="h-[calc(100vh-340px)] w-full">
                      <div className="border rounded-md p-3 bg-muted/30">
                        <pre className="text-xs font-mono whitespace-pre overflow-x-auto">
                          {documentation.mermaidDiagram}
                        </pre>
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
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
                    <div className="text-center text-muted-foreground py-12 text-xs">
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
