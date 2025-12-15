"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const AVAILABLE_COLORS = [
    { value: "#3b82f6", label: "Blue" }, // Low
    { value: "#22c55e", label: "Green" }, // Normal
    { value: "#f59e0b", label: "Amber" }, // High
    { value: "#ef4444", label: "Red" },   // Urgent
    { value: "#71717a", label: "Gray" },
];

export const PrioritySettings = ({ priorities = [], onChange }: PrioritySettingsProps) => {
    const [newPriority, setNewPriority] = useState<Priority>({
        key: "",
        label: "",
        color: "#22c55e",
        level: 1
    });

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
                    <div className="w-40 space-y-2">
                        <Label className="text-xs">Color</Label>
                        <Select
                            value={newPriority.color}
                            onValueChange={(val) => setNewPriority({ ...newPriority, color: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_COLORS.map(color => (
                                    <SelectItem key={color.value} value={color.value}>
                                        <div className="flex items-center gap-2">
                                            <div className="size-3 rounded-full" style={{ backgroundColor: color.value }} />
                                            {color.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                                className="flex items-center gap-3 p-3 bg-white border rounded-lg group"
                                            >
                                                <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-move">
                                                    <GripVertical className="size-4" />
                                                </div>
                                                <div
                                                    className="size-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium text-sm mr-2">{item.label}</span>
                                                    <span className="text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">Level {item.level}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemove(index)}
                                                >
                                                    <X className="size-4" />
                                                </Button>
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
        </div>
    );
};
