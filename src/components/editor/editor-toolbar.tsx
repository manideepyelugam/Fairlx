"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Link,
  Highlighter,
  Palette,
  Table,
  Plus,
  ChevronDown,
  ToggleLeft,
  Code2,
  Minus,
} from "lucide-react";
import { useState, useCallback } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface EditorToolbarProps {
  editor: Editor;
  onSetLink: () => void;
}

const FONT_COLORS = [
  { name: "Default", value: "" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
];

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Purple", value: "#e9d5ff" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Red", value: "#fecaca" },
  { name: "Gray", value: "#e5e7eb" },
];

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
}: ToolbarButtonProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center rounded p-1.5 hover:bg-accent transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const EditorToolbar = ({ editor, onSetLink }: EditorToolbarProps) => {
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  const addTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const addChecklist = useCallback(() => {
    editor.chain().focus().toggleTaskList().run();
  }, [editor]);

  const addCodeBlock = useCallback(() => {
    editor.chain().focus().toggleCodeBlock().run();
  }, [editor]);

  const insertHorizontalRule = useCallback(() => {
    editor.chain().focus().setHorizontalRule().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1">
      {/* Insert Menu */}
      <DropdownMenu open={showInsertMenu} onOpenChange={setShowInsertMenu}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            Insert
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={addChecklist}>
            <CheckSquare className="mr-2 size-4" />
            Checklist
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <ToggleLeft className="mr-2 size-4" />
            Toggle List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={addTable}>
            <Table className="mr-2 size-4" />
            Table
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={addCodeBlock}>
            <Code2 className="mr-2 size-4" />
            Code Block
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="mr-2 size-4" />
            Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={insertHorizontalRule}>
            <Minus className="mr-2 size-4" />
            Divider
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Heading Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
            {editor.isActive("heading", { level: 1 }) ? "H1" : 
             editor.isActive("heading", { level: 2 }) ? "H2" :
             editor.isActive("heading", { level: 3 }) ? "H3" :
             editor.isActive("heading", { level: 4 }) ? "H4" :
             "Text"}
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn(!editor.isActive("heading") && "bg-accent")}
          >
            <span className="text-sm">Normal text</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(editor.isActive("heading", { level: 1 }) && "bg-accent")}
          >
            <Heading1 className="mr-2 size-4" />
            <span className="text-xl font-bold">Heading 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(editor.isActive("heading", { level: 2 }) && "bg-accent")}
          >
            <Heading2 className="mr-2 size-4" />
            <span className="text-lg font-bold">Heading 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(editor.isActive("heading", { level: 3 }) && "bg-accent")}
          >
            <Heading3 className="mr-2 size-4" />
            <span className="text-base font-bold">Heading 3</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={cn(editor.isActive("heading", { level: 4 }) && "bg-accent")}
          >
            <span className="text-sm font-bold">Heading 4</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        tooltip="Bold (Ctrl+B)"
      >
        <Bold className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        tooltip="Italic (Ctrl+I)"
      >
        <Italic className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        tooltip="Underline (Ctrl+U)"
      >
        <Underline className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        tooltip="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        tooltip="Inline Code"
      >
        <Code className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Font Color */}
      <DropdownMenu open={showColorMenu} onOpenChange={setShowColorMenu}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center rounded p-1.5 hover:bg-accent transition-colors"
          >
            <Palette className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Text Color
          </div>
          <div className="grid grid-cols-5 gap-1 p-2">
            {FONT_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  if (color.value) {
                    editor.chain().focus().setColor(color.value).run();
                  } else {
                    editor.chain().focus().unsetColor().run();
                  }
                  setShowColorMenu(false);
                }}
                className={cn(
                  "size-6 rounded border border-border hover:ring-2 hover:ring-primary",
                  !color.value && "bg-foreground"
                )}
                style={{ backgroundColor: color.value || undefined }}
                title={color.name}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Highlighter */}
      <DropdownMenu open={showHighlightMenu} onOpenChange={setShowHighlightMenu}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center rounded p-1.5 hover:bg-accent transition-colors",
              editor.isActive("highlight") && "bg-accent"
            )}
          >
            <Highlighter className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Highlight Color
          </div>
          <div className="grid grid-cols-4 gap-1 p-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color: color.value }).run();
                  setShowHighlightMenu(false);
                }}
                className="size-6 rounded border border-border hover:ring-2 hover:ring-primary"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              setShowHighlightMenu(false);
            }}
          >
            Remove highlight
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        tooltip="Bullet List"
      >
        <List className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        tooltip="Numbered List"
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={addChecklist}
        isActive={editor.isActive("taskList")}
        tooltip="Checklist"
      >
        <CheckSquare className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Link */}
      <ToolbarButton
        onClick={onSetLink}
        isActive={editor.isActive("link")}
        tooltip="Add Link"
      >
        <Link className="size-4" />
      </ToolbarButton>

      {/* Table Controls (shown when inside table) */}
      {editor.isActive("table") && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
                <Table className="size-3.5" />
                Table
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              >
                Add column before
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                Add column after
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                Delete column
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addRowBefore().run()}
              >
                Add row before
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                Add row after
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                Delete row
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-destructive"
              >
                Delete table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {/* Hints for @ and / commands */}
      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">
          Type <kbd className="rounded bg-muted px-1 py-0.5 font-mono">@</kbd> to mention
        </span>
        <span className="hidden md:inline">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono">/</kbd> for commands
        </span>
      </div>
    </div>
  );
};
