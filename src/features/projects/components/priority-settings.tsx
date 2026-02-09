"use client";

import { useState } from "react";
import { Plus, GripVertical, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ColorPicker } from "@/components/color-picker";

interface Priority {
    key: string;
    label: string;
    color: string;
    level: number;
}

interface PrioritySettingsProps {
    priorities?: Priority[];
    onChange: (priorities: Priority[]) => void;
}

// Basic colors for initial suggestions now handled by ColorPicker

export const PrioritySettings = ({ priorities = [], onChange }: PrioritySettingsProps) => {
    const [newPriority, setNewPriority] = useState<Priority>({
        key: "",
        label: "",
        color: "#22c55e",
        level: 1
    });

    const [editingPriority, setEditingPriority] = useState<{ index: number; priority: Priority } | null>(null);

    const handleAdd = () => {
        if (!newPriority.label) return;

        const key = newPriority.label.toUpperCase().replace(/\s+/g, "_");
        // Auto-increment level based on count
        const level = priorities.length + 1;

        onChange([...priorities, { ...newPriority, key, level }]);
        setNewPriority({
            key: "",
            label: "",
            color: "#22c55e",
            level: 1
        });
    };

    const handleUpdate = () => {
        if (!editingPriority) return;
        const newPriorities = [...priorities];
        newPriorities[editingPriority.index] = editingPriority.priority;
        onChange(newPriorities);
        setEditingPriority(null);
    };

    const handleRemove = (index: number) => {
        const newPriorities = [...priorities];
        newPriorities.splice(index, 1);
        onChange(newPriorities);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(priorities);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update levels based on order
        const updatedItems = items.map((item, index) => ({
            ...item,
            level: index + 1
        }));

        onChange(updatedItems);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label>Add New Priority</Label>
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs">Label</Label>
                        <Input
                            value={newPriority.label}
                            onChange={(e) => setNewPriority({ ...newPriority, label: e.target.value })}
                            placeholder="e.g. Critical, Low"
                        />
                    </div>
                    <div className="w-60 space-y-2">
                        <Label className="text-xs">Color</Label>
                        <ColorPicker
                            value={newPriority.color}
                            onChange={(val) => setNewPriority({ ...newPriority, color: val })}
                        />
                    </div>
                    <Button onClick={handleAdd} type="button">
                        <Plus className="size-4 mr-2" />
                        Add
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <Label>Current Priorities (Ordered by Importance)</Label>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="priorities">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {priorities.map((item, index) => (
                                    <Draggable key={item.key || index} draggableId={item.key || `priority-${index}`} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg group"
                                            >
                                                <div {...provided.dragHandleProps} className="text-muted-foreground hover:text-foreground cursor-move">
                                                    <GripVertical className="size-4" />
                                                </div>
                                                <div
                                                    className="size-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium text-sm mr-2">{item.label}</span>
                                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Level {item.level}</span>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setEditingPriority({ index, priority: item })}>
                                                            <Edit2 className="size-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleRemove(index)}
                                                        >
                                                            <Trash2 className="size-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                {priorities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        No custom priorities defined
                    </div>
                )}
            </div>

            <Dialog open={!!editingPriority} onOpenChange={(open) => !open && setEditingPriority(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Priority</DialogTitle>
                        <DialogDescription>
                            Change the name and color for this priority.
                        </DialogDescription>
                    </DialogHeader>
                    {editingPriority && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    value={editingPriority.priority.label}
                                    onChange={(e) => setEditingPriority({
                                        ...editingPriority,
                                        priority: { ...editingPriority.priority, label: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <ColorPicker
                                    value={editingPriority.priority.color}
                                    onChange={(val) => setEditingPriority({
                                        ...editingPriority,
                                        priority: { ...editingPriority.priority, color: val }
                                    })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPriority(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
