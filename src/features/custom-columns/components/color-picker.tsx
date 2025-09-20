import * as React from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const colors = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#64748b", // slate
  "#6b7280", // gray
  "#374151", // neutral
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-10 p-0">
          <div 
            className="h-4 w-4 rounded border border-gray-300"
            style={{ backgroundColor: value || "#6b7280" }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <Button
              key={color}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
              style={{
                backgroundColor: color,
                borderColor: value === color ? "#000" : "#e5e7eb",
                borderWidth: value === color ? 2 : 1,
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
