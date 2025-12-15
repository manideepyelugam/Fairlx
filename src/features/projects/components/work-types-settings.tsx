"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { cn } from "@/lib/utils"; // Removed unused import

interface WorkItemType {
    key: string;
    label: string;
    icon: string;
    color: string;
}

interface WorkTypesSettingsProps {
    types?: WorkItemType[];
    onChange: (types: WorkItemType[]) => void;
}

const AVAILABLE_ICONS = [
    { value: "check-square", label: "Check Square" },
    { value: "bookmark", label: "Bookmark" },
    { value: "bug", label: "Bug" },
    { value: "clipboard", label: "Clipboard" },
    { value: "file-text", label: "File Text" },
    { value: "target", label: "Target" },
    { value: "zap", label: "Zap" },
];

const AVAILABLE_COLORS = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#22c55e", label: "Green" },
    { value: "#ef4444", label: "Red" },
    { value: "#f59e0b", label: "Amber" },
    { value: "#8b5cf6", label: "Violet" },
    { value: "#ec4899", label: "Pink" },
];

export const WorkTypesSettings = ({ types = [], onChange }: WorkTypesSettingsProps) => {
    const [newType, setNewType] = useState<WorkItemType>({
        key: "",
        label: "",
        icon: "check-square",
        color: "#3b82f6"
    });

    const handleAdd = () => {
        if (!newType.label) return;

        const key = newType.label.toUpperCase().replace(/\s+/g, "_");

        onChange([...types, { ...newType, key }]);
        setNewType({
            key: "",
            label: "",
            icon: "check-square",
            color: "#3b82f6"
        });
    };

    const handleRemove = (index: number) => {
        const newTypes = [...types];
        newTypes.splice(index, 1);
        onChange(newTypes);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(types);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onChange(items);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label>Add New Work Item Type</Label>
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs">Label</Label>
                        <Input
                            value={newType.label}
                            onChange={(e) => setNewType({ ...newType, label: e.target.value })}
                            placeholder="e.g. Feature, Bug, Task"
                        />
                    </div>
                    <div className="w-40 space-y-2">
                        <Label className="text-xs">Icon</Label>
                        <Select
                            value={newType.icon}
                            onValueChange={(val) => setNewType({ ...newType, icon: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ICONS.map(icon => (
                                    <SelectItem key={icon.value} value={icon.value}>
                                        {icon.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-40 space-y-2">
                        <Label className="text-xs">Color</Label>
                        <Select
                            value={newType.color}
                            onValueChange={(val) => setNewType({ ...newType, color: val })}
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
                <Label>Current Types</Label>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="work-types">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {types.map((type, index) => (
                                    <Draggable key={type.key || index} draggableId={type.key || `type-${index}`} index={index}>
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
                                                    className="size-8 rounded-md flex items-center justify-center text-white"
                                                    style={{ backgroundColor: type.color }}
                                                >
                                                    {/* We'll implement dynamic icon rendering later if needed, for now simplified */}
                                                    <div className="size-4 bg-current opacity-50" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{type.label}</p>
                                                    <p className="text-xs text-muted-foreground">{type.key}</p>
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
                {types.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        No custom types defined
                    </div>
                )}
            </div>
        </div>
    );
};
