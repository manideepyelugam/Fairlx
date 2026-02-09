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
import { IconPicker } from "@/components/icon-picker";
import { ColorPicker } from "@/components/color-picker";
import * as LucideIcons from "lucide-react";

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

// Basic icons for initial suggestions, but IconPicker allows searching all

export const WorkTypesSettings = ({ types = [], onChange }: WorkTypesSettingsProps) => {
    const [newType, setNewType] = useState<WorkItemType>({
        key: "",
        label: "",
        icon: "CheckSquare",
        color: "#3b82f6"
    });

    const [editingType, setEditingType] = useState<{ index: number; type: WorkItemType } | null>(null);

    const handleAdd = () => {
        if (!newType.label) return;

        const key = newType.label.toUpperCase().replace(/\s+/g, "_");

        onChange([...types, { ...newType, key }]);
        setNewType({
            key: "",
            label: "",
            icon: "CheckSquare",
            color: "#3b82f6"
        });
    };

    const handleUpdate = () => {
        if (!editingType) return;
        const newTypes = [...types];
        newTypes[editingType.index] = editingType.type;
        onChange(newTypes);
        setEditingType(null);
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
                    <div className="w-60 space-y-2">
                        <Label className="text-xs">Icon</Label>
                        <div className="flex gap-2">
                            <IconPicker
                                value={newType.icon}
                                onChange={(val) => setNewType({ ...newType, icon: val })}
                            />
                        </div>
                    </div>
                    <div className="w-60 space-y-2">
                        <Label className="text-xs">Color</Label>
                        <ColorPicker
                            value={newType.color}
                            onChange={(val) => setNewType({ ...newType, color: val })}
                        />
                    </div>
                    <Button onClick={handleAdd} type="button" className="h-10">
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
                                                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg group"
                                            >
                                                <div {...provided.dragHandleProps} className="text-muted-foreground hover:text-foreground cursor-move">
                                                    <GripVertical className="size-4" />
                                                </div>
                                                <div
                                                    className="size-8 rounded-md flex items-center justify-center text-white"
                                                    style={{ backgroundColor: type.color }}
                                                >
                                                    {(() => {
                                                        const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
                                                        const Icon = icons[type.icon] || LucideIcons.CheckSquare;
                                                        return <Icon className="size-4" />;
                                                    })()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{type.label}</p>
                                                    <p className="text-xs text-muted-foreground">{type.key}</p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setEditingType({ index, type })}>
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
                {types.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        No custom types defined
                    </div>
                )}
            </div>

            <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Work Item Type</DialogTitle>
                        <DialogDescription>
                            Change the name, icon, and color for this work item type.
                        </DialogDescription>
                    </DialogHeader>
                    {editingType && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    value={editingType.type.label}
                                    onChange={(e) => setEditingType({
                                        ...editingType,
                                        type: { ...editingType.type, label: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <IconPicker
                                        value={editingType.type.icon}
                                        onChange={(val) => setEditingType({
                                            ...editingType,
                                            type: { ...editingType.type, icon: val }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <ColorPicker
                                        value={editingType.type.color}
                                        onChange={(val) => setEditingType({
                                            ...editingType,
                                            type: { ...editingType.type, color: val }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingType(null)}>
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
