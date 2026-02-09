"use client";

import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

// Filter out non-icon exports from lucide-react (like types or helper functions)
const ALL_ICONS = Object.keys(LucideIcons).filter(
    (key) => /^[A-Z]/.test(key) &&
        (typeof (LucideIcons as Record<string, unknown>)[key] === "function" || typeof (LucideIcons as Record<string, unknown>)[key] === "object") &&
        key !== "LucideIcon" && key !== "LucideProps"
).sort();

export const IconPicker = ({ value, onChange, className }: IconPickerProps) => {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const filteredIcons = useMemo(() => {
        if (!search) return ALL_ICONS.slice(0, 150); // Limit initial view for performance
        return ALL_ICONS.filter((name) =>
            name.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 300); // Larger slice for search
    }, [search]);

    const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
    const SelectedIcon = icons[value] || LucideIcons.HelpCircle;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    <div className="flex items-center gap-2">
                        <SelectedIcon className="size-4" />
                        <span className="truncate">{value || "Select icon..."}</span>
                    </div>
                    <LucideIcons.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full border-0 focus-visible:ring-0"
                    />
                </div>
                <ScrollArea className="h-[300px] p-2">
                    <div className="grid grid-cols-5 gap-2">
                        {filteredIcons.map((name) => {
                            const Icon = icons[name];
                            return (
                                <Button
                                    key={name}
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 p-0 hover:bg-accent hover:text-accent-foreground",
                                        value === name && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => {
                                        onChange(name);
                                        setOpen(false);
                                    }}
                                    title={name}
                                >
                                    <Icon className="size-4" />
                                </Button>
                            );
                        })}
                    </div>
                    {filteredIcons.length === 0 && (
                        <p className="text-center py-4 text-xs text-muted-foreground">
                            No icons found.
                        </p>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
