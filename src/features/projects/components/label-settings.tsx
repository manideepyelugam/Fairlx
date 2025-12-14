"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomLabel {
    name: string;
    color: string;
}

interface LabelSettingsProps {
    labels?: CustomLabel[];
    onChange: (labels: CustomLabel[]) => void;
}

export const LabelSettings = ({ labels = [], onChange }: LabelSettingsProps) => {
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
                    <div className="w-20 space-y-2">
                        <Label className="text-xs">Color</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="color"
                                value={newLabel.color}
                                onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}
                                className="w-12 h-10 p-1 cursor-pointer"
                            />
                        </div>
                    </div>
                    <Button onClick={handleAdd} type="button">
                        <Plus className="size-4 mr-2" />
                        Add
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {labels.map((label, index) => (
                    <div key={index} className="flex items-center justify-between p-2 pl-3 bg-white border rounded-md group">
                        <div className="flex items-center gap-2">
                            <div
                                className="size-3 rounded-full"
                                style={{ backgroundColor: label.color }}
                            />
                            <span className="text-sm font-medium">{label.name}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemove(index)}
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>
                ))}
            </div>
            {labels.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No custom labels defined
                </div>
            )}
        </div>
    );
};
