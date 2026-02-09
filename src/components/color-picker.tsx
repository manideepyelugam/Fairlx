"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#22c55e", // Green
    "#ef4444", // Red
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f97316", // Orange
    "#6366f1", // Indigo
    "#a855f7", // Purple
    "#d946ef", // Fuchsia
    "#14b8a6", // Teal
    "#84cc16", // Lime
    "#eab308", // Yellow
];

export const ColorPicker = ({ value, onChange, className }: ColorPickerProps) => {
    const [inputValue, setInputValue] = useState(value);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
            onChange(newValue);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-full justify-start gap-2 h-10 px-3", className)}
                >
                    <div
                        className="size-4 rounded-full border border-border"
                        style={{ backgroundColor: value }}
                    />
                    <span className="truncate">{value || "Select color..."}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                className={cn(
                                    "size-8 rounded-md border border-border transition-transform hover:scale-110",
                                    value === color && "ring-2 ring-primary ring-offset-1"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    onChange(color);
                                    setOpen(false);
                                }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 border-t pt-3">
                        <div
                            className="size-8 rounded-md border border-border flex-shrink-0"
                            style={{ backgroundColor: inputValue }}
                        />
                        <Input
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="#000000"
                            className="h-8 text-xs font-mono"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
