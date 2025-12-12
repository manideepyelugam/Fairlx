"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GitBranch,
  Trash2,
  Plus,
} from "lucide-react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Connection,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useGetWorkflow } from "@/features/workflows/api/use-get-workflow";
import { useDeleteWorkflow } from "@/features/workflows/api/use-delete-workflow";
import { useCreateWorkflowStatus } from "@/features/workflows/api/use-create-workflow-status";
import { useUpdateStatus } from "@/features/workflows/api/use-update-status";
import { useDeleteStatus } from "@/features/workflows/api/use-delete-status";
import { useCreateTransition } from "@/features/workflows/api/use-create-transition";
import { useUpdateTransition } from "@/features/workflows/api/use-update-transition";
import { useDeleteTransition } from "@/features/workflows/api/use-delete-transition";
import { useConfirm } from "@/hooks/use-confirm";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";

import {
  WorkflowStatus,
  WorkflowTransition,
  StatusNodeData,
  convertStatusesToNodes,
  convertTransitionsToEdges,
  StatusNode as StatusNodeType,
  TransitionEdge as TransitionEdgeType,
} from "@/features/workflows/types";
import { StatusNode } from "@/features/workflows/components/status-node";
import { TransitionEdge } from "@/features/workflows/components/transition-edge";
import { StatusEditDialog } from "@/features/workflows/components/status-edit-dialog";
import { TransitionEditDialog } from "@/features/workflows/components/transition-edit-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  statusNode: StatusNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: Record<string, any> = {
  transitionEdge: TransitionEdge,
};

// Inner component that uses ReactFlow hooks
const WorkflowEditor = () => {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.workflowId as string;
  const spaceId = params.spaceId as string;
  const workspaceId = useWorkspaceId();
  const { isAdmin } = useCurrentMember({ workspaceId });

  const { data: workflow, isLoading: workflowLoading } = useGetWorkflow({ workflowId });
  const { mutate: deleteWorkflow, isPending: isDeleting } = useDeleteWorkflow();
  const { mutateAsync: createStatus } = useCreateWorkflowStatus();
  const { mutateAsync: updateStatus } = useUpdateStatus();
  const { mutateAsync: deleteStatusMutation } = useDeleteStatus();
  const { mutateAsync: createTransition } = useCreateTransition();
  const { mutateAsync: updateTransition } = useUpdateTransition();
  const { mutateAsync: deleteTransitionMutation } = useDeleteTransition();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Workflow",
    "Are you sure you want to delete this workflow? This action cannot be undone.",
    "destructive"
  );

  const [DeleteStatusDialog, confirmDeleteStatus] = useConfirm(
    "Delete Status",
    "Are you sure? Deleting this status will also delete all transitions to/from it.",
    "destructive"
  );

  const [DeleteTransitionDialog, confirmDeleteTransition] = useConfirm(
    "Delete Transition",
    "Are you sure you want to delete this transition?",
    "destructive"
  );

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkflowStatus | null>(null);
  const [editingTransition, setEditingTransition] = useState<WorkflowTransition | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  const [nodes, setNodes, onNodesChange] = useNodesState<StatusNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TransitionEdgeType>([]);

  // Use refs to avoid dependency issues in callbacks
  const workflowRef = useRef(workflow);
  workflowRef.current = workflow;

  const confirmDeleteStatusRef = useRef(confirmDeleteStatus);
  confirmDeleteStatusRef.current = confirmDeleteStatus;

  const confirmDeleteTransitionRef = useRef(confirmDeleteTransition);
  confirmDeleteTransitionRef.current = confirmDeleteTransition;

  // Status edit/delete handlers for nodes - use refs to avoid infinite loops
  const handleNodeEdit = useCallback((statusId: string) => {
    const status = workflowRef.current?.statuses?.find(s => s.$id === statusId);
    if (status) {
      setEditingStatus(status);
      setStatusDialogOpen(true);
    }
  }, []);

  const handleNodeDelete = useCallback(async (statusId: string) => {
    const ok = await confirmDeleteStatusRef.current();
    if (!ok) return;
    await deleteStatusMutation({
      param: { workflowId, statusId },
    });
  }, [workflowId, deleteStatusMutation]);

  // Transition edit/delete handlers for edges - use refs to avoid infinite loops
  const handleEdgeEdit = useCallback((transitionId: string) => {
    const transition = workflowRef.current?.transitions?.find(t => t.$id === transitionId);
    if (transition) {
      setEditingTransition(transition);
      setTransitionDialogOpen(true);
    }
  }, []);

  const handleEdgeDelete = useCallback(async (transitionId: string) => {
    const ok = await confirmDeleteTransitionRef.current();
    if (!ok) return;
    await deleteTransitionMutation({
      param: { workflowId, transitionId },
    });
  }, [workflowId, deleteTransitionMutation]);

  // Convert workflow data to React Flow nodes and edges
  useEffect(() => {
    if (workflow?.statuses) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setNodes(convertStatusesToNodes(workflow.statuses, handleNodeEdit, handleNodeDelete) as any);
    }
    if (workflow?.transitions) {
      setEdges(convertTransitionsToEdges(workflow.transitions, handleEdgeEdit, handleEdgeDelete));
    }
  }, [workflow?.statuses, workflow?.transitions, setNodes, setEdges, handleNodeEdit, handleNodeDelete, handleEdgeEdit, handleEdgeDelete]);

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;

    deleteWorkflow(
      { param: { workflowId } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${workspaceId}/spaces/${spaceId}/workflows`);
        },
      }
    );
  };

  // Handle new connection (transition) creation
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        await createTransition({
          param: { workflowId },
          json: {
            fromStatusId: connection.source,
            toStatusId: connection.target,
          },
        });
      } catch (error) {
        console.error("Failed to create transition:", error);
      }
    },
    [workflowId, createTransition]
  );

  // Handle node position change (drag)
  const onNodeDragStop = useCallback(
    async (_event: React.MouseEvent, node: Node<StatusNodeData>) => {
      try {
        await updateStatus({
          param: { workflowId, statusId: node.id },
          json: {
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
          },
        });
      } catch (error) {
        console.error("Failed to save position:", error);
      }
    },
    [workflowId, updateStatus]
  );

  // Status handlers
  const handleAddStatus = () => {
    setEditingStatus(null);
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async (data: Partial<WorkflowStatus>) => {
    if (editingStatus) {
      await updateStatus({
        param: { workflowId, statusId: editingStatus.$id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json: data as any,
      });
    } else {
      // Calculate position for new status
      const lastNode = nodes[nodes.length - 1];
      const positionX = lastNode ? lastNode.position.x + 250 : 100;
      const positionY = lastNode ? lastNode.position.y : 100;

      await createStatus({
        param: { workflowId },
        json: {
          ...data,
          positionX,
          positionY,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
    }
    setStatusDialogOpen(false);
    setEditingStatus(null);
  };

  // Transition handlers
  const handleSaveTransition = async (data: Partial<WorkflowTransition>) => {
    if (editingTransition) {
      await updateTransition({
        param: { workflowId, transitionId: editingTransition.$id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json: data as any,
      });
    }
    setTransitionDialogOpen(false);
    setEditingTransition(null);
  };

  if (workflowLoading) {
    return <PageLoader />;
  }

  if (!workflow) {
    return <PageError message="Workflow not found" />;
  }

  const statuses = workflow.statuses || [];
  const transitions = workflow.transitions || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <DeleteDialog />
      <DeleteStatusDialog />
      <DeleteTransitionDialog />

      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/workspaces/${workspaceId}/spaces/${spaceId}/workflows`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="size-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{workflow.name}</h1>
                {workflow.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
                {workflow.isSystem && (
                  <Badge variant="outline" className="text-xs">System</Badge>
                )}
              </div>
              {workflow.description && (
                <p className="text-xs text-muted-foreground">{workflow.description}</p>
              )}
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {statuses.length} statuses
            </Badge>
            <Badge variant="outline" className="text-xs">
              {transitions.length} transitions
            </Badge>
          </div>
          {isAdmin && !workflow.isSystem && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddStatus}
              >
                <Plus className="size-4 mr-2" />
                Add Status
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onMove={(_, viewport) => setZoomLevel(Math.round(viewport.zoom * 100))}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.4, maxZoom: 0.8 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "transitionEdge",
            animated: true,
          }}
          connectionLineStyle={{
            stroke: "#3B82F6",
            strokeWidth: 2,
            strokeDasharray: "5,5",
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-muted/30"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-background/80 !border-border !right-3 !bottom-3"
          />

          {/* Zoom Indicator - moved to top-left next to Controls */}
          <Panel position="top-left" className="!top-14 !left-3 !z-50">
            <Badge variant="secondary" className="text-xs font-mono !bg-primary/7 !text-primary !border-primary/10">
              {zoomLevel}%
            </Badge>
          </Panel>

          <Panel position="top-right" className="flex gap-2">
            <Card className="p-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                  <span>To Do</span>
                </div>
                <Separator orientation="vertical" className="h-3" />
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>In Progress</span>
                </div>
                <Separator orientation="vertical" className="h-3" />
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span>Done</span>
                </div>
              </div>
            </Card>
          </Panel>

          {/* Help Tip - moved and restyled */}
          <Panel position="top-right" className="!top-20 !right-2 !z-40">
            <Card className="p-2 max-w-[220px] !bg-primary/6 !border !border-primary/10 shadow-md">
              <p className="text-[12px] text-primary leading-snug">
                💡 <strong>Tip:</strong> Drag from one status to another to create transitions. Click the transition label then the Edit icon to set approval rules.
              </p>
            </Card>
          </Panel>

          {statuses.length === 0 && (
            <Panel position="top-center" className="!top-1/2 !-translate-y-1/2">
              <Card className="p-6 text-center">
                <GitBranch className="size-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-2">No Statuses Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add statuses to define workflow stages, then connect them with transitions.
                </p>
                {isAdmin && (
                  <Button onClick={handleAddStatus}>
                    <Plus className="size-4 mr-2" />
                    Add First Status
                  </Button>
                )}
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Dialogs */}
      <StatusEditDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        status={editingStatus}
        workflowId={workflowId}
        existingKeys={workflow?.statuses?.map((s: WorkflowStatus) => s.key) || []}
        onSave={handleSaveStatus}
      />

      <TransitionEditDialog
        open={transitionDialogOpen}
        onOpenChange={setTransitionDialogOpen}
        transition={editingTransition}
        statuses={statuses}
        onSave={handleSaveTransition}
      />
    </div>
  );
};

// Wrap with ReactFlowProvider for useReactFlow hooks
export const WorkflowDetailClient = () => {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
};