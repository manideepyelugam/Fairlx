"use client";

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Position,
} from "@xyflow/react";
import { Edit, Trash2, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { TransitionEdgeData } from "../types";

type TransitionEdgeProps = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: TransitionEdgeData;
  selected?: boolean;
};

export const TransitionEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: TransitionEdgeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.25,
    });

    const hasRules = 
      (data?.requiredFields && data.requiredFields.length > 0) ||
      (data?.allowedRoles && data.allowedRoles.length > 0) ||
      data?.autoAssign;

    return (
      <>
        {/* Invisible wider path for easier hover/selection */}
        <path
          d={edgePath}
          fill="none"
          strokeWidth={20}
          stroke="transparent"
          className="cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />

        {/* Visible edge */}
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: selected ? "hsl(var(--primary))" : isHovered ? "hsl(var(--primary)/0.7)" : "hsl(var(--muted-foreground)/0.4)",
            strokeWidth: selected ? 2.5 : isHovered ? 2 : 1.5,
            transition: "stroke 0.2s, stroke-width 0.2s",
          }}
          markerEnd="url(#arrow)"
        />

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrow"
            markerWidth="12"
            markerHeight="12"
            refX="8"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M2,2 L10,6 L2,10 L4,6 L2,2"
              fill={selected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.6)"}
            />
          </marker>
        </defs>

        {/* Edge Label */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200",
                    "bg-background border shadow-sm",
                    selected || isHovered
                      ? "border-primary bg-primary/5 scale-105"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {data?.name ? (
                    <>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className="max-w-[100px] truncate">{data.name}</span>
                    </>
                  ) : (
                    <ArrowRight className="size-3 text-muted-foreground" />
                  )}
                  {hasRules && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="center">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Transition</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => data?.onEdit(data.id)}
                      >
                        <Edit className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => data?.onDelete(data.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {data?.name && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="text-sm">{data.name}</p>
                    </div>
                  )}

                  {data?.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">{data.description}</p>
                    </div>
                  )}

                  {/* Rules Summary */}
                  {hasRules && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Rules</p>
                      <div className="flex flex-wrap gap-1">
                        {data?.autoAssign && (
                          <Badge variant="secondary" className="text-[10px]">
                            Auto-assign
                          </Badge>
                        )}
                        {data?.requiredFields && data.requiredFields.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {data.requiredFields.length} required field(s)
                          </Badge>
                        )}
                        {data?.allowedRoles && data.allowedRoles.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {data.allowedRoles.length} role(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {!hasRules && !data?.name && !data?.description && (
                    <p className="text-xs text-muted-foreground italic">
                      No rules configured. Click edit to add transition rules.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

TransitionEdge.displayName = "TransitionEdge";
