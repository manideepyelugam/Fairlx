"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Save, Undo, Redo, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { StatusNode } from "./status-node";
import { TransitionEdge } from "./transition-edge";
import { StatusEditDialog } from "./status-edit-dialog";
import { TransitionEditDialog } from "./transition-edit-dialog";
import {
  WorkflowStatus,
  WorkflowTransition,
  StatusNodeData,
  TransitionEdgeData,
  StatusCategory,
  convertStatusesToNodes,
  convertTransitionsToEdges,
} from "../types";

// Custom node and edge types
const nodeTypes = {
  statusNode: StatusNode as any,
};

const edgeTypes = {
  transitionEdge: TransitionEdge as any,
};

interface WorkflowEditorProps {
  workflowId: string;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
  isReadOnly?: boolean;
  onStatusCreate: (data: Partial<WorkflowStatus>) => Promise<void>;
  onStatusUpdate: (statusId: string, data: Partial<WorkflowStatus>) => Promise<void>;
  onStatusDelete: (statusId: string) => Promise<void>;
  onStatusPositionUpdate: (statusId: string, x: number, y: number) => Promise<void>;
  onTransitionCreate: (fromStatusId: string, toStatusId: string) => Promise<void>;
  onTransitionUpdate: (transitionId: string, data: Partial<WorkflowTransition>) => Promise<void>;
  onTransitionDelete: (transitionId: string) => Promise<void>;
}

export const WorkflowEditor = ({
  workflowId,
  statuses,
  transitions,
  isReadOnly = false,
  onStatusCreate,
  onStatusUpdate,
  onStatusDelete,
  onStatusPositionUpdate,
  onTransitionCreate,
  onTransitionUpdate,
  onTransitionDelete,
}: WorkflowEditorProps) => {
  // Dialog states
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);
  const [isCreatingStatus, setIsCreatingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Handle status delete callback
  const handleStatusDelete = useCallback(async (id: string) => {
    try {
      await onStatusDelete(id);
    } catch (error) {
      console.error("Failed to delete status:", error);
    }
  }, [onStatusDelete]);

  // Handle transition delete callback
  const handleTransitionDelete = useCallback(async (id: string) => {
    try {
      await onTransitionDelete(id);
    } catch (error) {
      console.error("Failed to delete transition:", error);
    }
  }, [onTransitionDelete]);

  // Update nodes/edges when props change
  useEffect(() => {
    const newNodes = convertStatusesToNodes(
      statuses,
      (id) => setEditingStatusId(id),
      handleStatusDelete
    );
    const newEdges = convertTransitionsToEdges(
      transitions,
      (id) => setEditingTransitionId(id),
      handleTransitionDelete
    );
    setNodes(newNodes as any);
    setEdges(newEdges as any);
  }, [statuses, transitions, setNodes, setEdges, handleStatusDelete, handleTransitionDelete]);

  // Handle new connection (transition)
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (isReadOnly || !connection.source || !connection.target) return;

      // Check if transition already exists
      const exists = edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) return;

      try {
        await onTransitionCreate(connection.source, connection.target);
      } catch (error) {
        console.error("Failed to create transition:", error);
      }
    },
    [edges, isReadOnly, onTransitionCreate]
  );

  // Handle node drag end (update position)
  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      if (isReadOnly) return;

      try {
        await onStatusPositionUpdate(node.id, node.position.x, node.position.y);
      } catch (error) {
        console.error("Failed to update position:", error);
      }
    },
    [isReadOnly, onStatusPositionUpdate]
  );

  // Handle add new status
  const handleAddStatus = async () => {
    setIsCreatingStatus(true);
  };

  // Get current editing status/transition
  const editingStatus = editingStatusId
    ? statuses.find((s) => s.$id === editingStatusId)
    : null;

  const editingTransition = editingTransitionId
    ? transitions.find((t) => t.$id === editingTransitionId)
    : null;

  return (
    <TooltipProvider>
      <div className="w-full h-[600px] rounded-xl border bg-muted/30 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: "transitionEdge",
            animated: true,
          }}
          connectionLineStyle={{
            stroke: "hsl(var(--primary))",
            strokeWidth: 2,
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={!isReadOnly}
          nodesConnectable={!isReadOnly}
          elementsSelectable={!isReadOnly}
          className="workflow-editor"
        >
          {/* Background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--muted-foreground)/0.2)"
          />

          {/* Minimap */}
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as StatusNodeData;
              return data?.color || "#6B7280";
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-background !border !border-border !rounded-lg"
          />

          {/* Controls */}
          <Controls
            showZoom={false}
            showFitView={false}
            showInteractive={false}
            className="!bg-background !border !border-border !rounded-lg !shadow-lg"
          />

          {/* Top Panel - Actions */}
          {!isReadOnly && (
            <Panel position="top-left" className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddStatus}
                className="gap-2 shadow-lg"
              >
                <Plus className="size-4" />
                Add Status
              </Button>
            </Panel>
          )}

          {/* Top Right Panel - Info */}
          <Panel position="top-right" className="flex gap-2">
            <Badge variant="secondary" className="shadow-sm">
              {statuses.length} status{statuses.length !== 1 ? "es" : ""}
            </Badge>
            <Badge variant="secondary" className="shadow-sm">
              {transitions.length} transition{transitions.length !== 1 ? "s" : ""}
            </Badge>
          </Panel>

          {/* Bottom Panel - Help */}
          <Panel position="bottom-center">
            <div className="bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2 text-xs text-muted-foreground">
              <span className="font-medium">Tip:</span> Drag from one status to another to create a transition.
              {" "}Click on a status or transition to edit it.
            </div>
          </Panel>
        </ReactFlow>

        {/* Status Edit Dialog */}
        <StatusEditDialog
          open={!!editingStatusId || isCreatingStatus}
          onOpenChange={(open) => {
            if (!open) {
              setEditingStatusId(null);
              setIsCreatingStatus(false);
            }
          }}
          status={editingStatus}
          workflowId={workflowId}
          existingKeys={statuses.map((s) => s.key)}
          onSave={async (data) => {
            if (editingStatusId) {
              await onStatusUpdate(editingStatusId, data);
            } else {
              await onStatusCreate(data);
            }
            setEditingStatusId(null);
            setIsCreatingStatus(false);
          }}
        />

        {/* Transition Edit Dialog */}
        <TransitionEditDialog
          open={!!editingTransitionId}
          onOpenChange={(open) => {
            if (!open) setEditingTransitionId(null);
          }}
          transition={editingTransition}
          statuses={statuses}
          onSave={async (data) => {
            if (editingTransitionId) {
              await onTransitionUpdate(editingTransitionId, data);
            }
            setEditingTransitionId(null);
          }}
        />
      </div>
    </TooltipProvider>
  );
};
