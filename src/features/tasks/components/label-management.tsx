import { useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LabelBadgeProps {
  label: string;
  onRemove?: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export const LabelBadge = ({
  label,
  onRemove,
  variant = "secondary",
  className,
}: LabelBadgeProps) => {
  return (
    <Badge variant={variant} className={cn("text-xs", className)}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-muted rounded-full"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};

interface LabelsDisplayProps {
  labels: string[];
  onRemove?: (label: string) => void;
  maxDisplay?: number;
  className?: string;
}

export const LabelsDisplay = ({
  labels,
  onRemove,
  maxDisplay = 3,
  className,
}: LabelsDisplayProps) => {
  const displayLabels = labels.slice(0, maxDisplay);
  const hiddenCount = labels.length - maxDisplay;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayLabels.map((label) => (
        <LabelBadge
          key={label}
          label={label}
          onRemove={onRemove ? () => onRemove(label) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
};

interface LabelSelectorProps {
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  availableLabels?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export const LabelSelector = ({
  selectedLabels = [],
  onLabelsChange,
  availableLabels = [],
  placeholder = "Add labels...",
  disabled = false,
}: LabelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const addLabel = (label: string) => {
    if (label && !selectedLabels.includes(label)) {
      onLabelsChange([...selectedLabels, label]);
    }
  };

  const removeLabel = (label: string) => {
    onLabelsChange(selectedLabels.filter((l) => l !== label));
  };

  const handleCreateLabel = () => {
    if (newLabel.trim()) {
      addLabel(newLabel.trim());
      setNewLabel("");
      setOpen(false);
    }
  };

  const filteredLabels = availableLabels.filter(
    (label) =>
      !selectedLabels.includes(label) &&
      label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {selectedLabels.length > 0 && (
        <LabelsDisplay labels={selectedLabels} onRemove={removeLabel} />
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 justify-start"
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2">
          <div className="space-y-2">
            <Input
              placeholder="Search or create label..."
              value={newLabel}
              onChange={(e) => {
                setNewLabel(e.target.value);
                setSearchTerm(e.target.value);
              }}
            />
            
            {newLabel.trim() && !filteredLabels.includes(newLabel.trim()) && (
              <Button
                onClick={handleCreateLabel}
                className="w-full justify-start"
                variant="ghost"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create "{newLabel.trim()}"
              </Button>
            )}

            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredLabels.map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    addLabel(label);
                    setOpen(false);
                    setNewLabel("");
                    setSearchTerm("");
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
            
            {filteredLabels.length === 0 && !newLabel.trim() && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No labels found
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface LabelFilterProps {
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  availableLabels: string[];
  placeholder?: string;
}

export const LabelFilter = ({
  selectedLabels = [],
  onLabelsChange,
  availableLabels = [],
  placeholder = "Filter by labels",
}: LabelFilterProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      onLabelsChange(selectedLabels.filter((l) => l !== label));
    } else {
      onLabelsChange([...selectedLabels, label]);
    }
  };

  const filteredLabels = availableLabels.filter((label) =>
    label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {selectedLabels.length > 0 && (
        <LabelsDisplay
          labels={selectedLabels}
          onRemove={(label) =>
            onLabelsChange(selectedLabels.filter((l) => l !== label))
          }
        />
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2">
          <div className="space-y-2">
            <Input
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredLabels.map((label) => (
                <div
                  key={label}
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                  onClick={() => toggleLabel(label)}
                >
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(label)}
                    onChange={() => toggleLabel(label)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
            
            {filteredLabels.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No labels found
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};