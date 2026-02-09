"use client";

import { useState } from "react";
import { Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
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

interface CustomLabel {
    name: string;
    color: string;
}

interface LabelSettingsProps {
    labels?: CustomLabel[];
    onChange: (labels: CustomLabel[]) => void;
}

export const LabelSettings = ({ labels = [], onChange }: LabelSettingsProps) => {
    const [editingLabel, setEditingLabel] = useState<{ index: number; label: CustomLabel } | null>(null);

    const [newLabel, setNewLabel] = useState<CustomLabel>({
        name: "",
        color: "#6b7280"
    });

    const handleAdd = () => {
        if (!newLabel.name) return;

        // Generate random or hashed color if default hasn't been changed? 
        // For now keep simple input or random color generator
        const color = newLabel.color === "#6b7280"
            ? `#${Math.floor(Math.random() * 16777215).toString(16)}`
            : newLabel.color;

        onChange([...labels, { ...newLabel, color }]);
        setNewLabel({
            name: "",
            color: "#6b7280"
        });
    };

    const handleUpdate = () => {
        if (!editingLabel) return;
        const newLabels = [...labels];
        newLabels[editingLabel.index] = editingLabel.label;
        onChange(newLabels);
        setEditingLabel(null);
    };

    const handleRemove = (index: number) => {
        const newLabels = [...labels];
        newLabels.splice(index, 1);
        onChange(newLabels);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label>Add New Label</Label>
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                            value={newLabel.name}
                            onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                            placeholder="e.g. Frontend, Backend, Design"
                        />
                    </div>
                    <div className="w-60 space-y-2">
                        <Label className="text-xs">Color</Label>
                        <ColorPicker
                            value={newLabel.color}
                            onChange={(val) => setNewLabel({ ...newLabel, color: val })}
                        />
                    </div>
                    <Button onClick={handleAdd} type="button">
                        <Plus className="size-4 mr-2" />
                        Add
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {labels.map((label, index) => (
                    <div key={index} className="flex items-center justify-between p-2 pl-3 bg-card border border-border rounded-md group">
                        <div className="flex items-center gap-2">
                            <div
                                className="size-3 rounded-full"
                                style={{ backgroundColor: label.color }}
                            />
                            <span className="text-sm font-medium">{label.name}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingLabel({ index, label })}>
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
                ))}
            </div>
            {labels.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No custom labels defined
                </div>
            )}

            <Dialog open={!!editingLabel} onOpenChange={(open) => !open && setEditingLabel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Label</DialogTitle>
                        <DialogDescription>
                            Change the name and color for this label.
                        </DialogDescription>
                    </DialogHeader>
                    {editingLabel && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={editingLabel.label.name}
                                    onChange={(e) => setEditingLabel({
                                        ...editingLabel,
                                        label: { ...editingLabel.label, name: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <ColorPicker
                                    value={editingLabel.label.color}
                                    onChange={(val) => setEditingLabel({
                                        ...editingLabel,
                                        label: { ...editingLabel.label, color: val }
                                    })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingLabel(null)}>
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
