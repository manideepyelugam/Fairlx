"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { OPTIONAL_CONFIG_CATEGORIES } from "../constants";

interface AdditionalConfigStepProps {
    onComplete: (config: Record<string, string>) => void;
    onSkip: () => void;
}

export const AdditionalConfigStep = ({
    onComplete,
    onSkip,
}: AdditionalConfigStepProps) => {
    const [values, setValues] = useState<Record<string, string>>({});
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const handleChange = (key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
        // Filter out empty values
        const filtered: Record<string, string> = {};
        for (const [key, val] of Object.entries(values)) {
            if (val.trim()) filtered[key] = val.trim();
        }
        onComplete(filtered);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold">Additional Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    These are <strong>optional</strong>. You can skip and configure them
                    later in your organisation settings.
                </p>
            </div>

            <div className="space-y-3">
                {OPTIONAL_CONFIG_CATEGORIES.map((cat) => (
                    <div
                        key={cat.category}
                        className="border rounded-lg overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() =>
                                setExpandedCategory(
                                    expandedCategory === cat.category
                                        ? null
                                        : cat.category
                                )
                            }
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        >
                            <span className="text-sm font-medium">
                                {cat.category}
                            </span>
                            {expandedCategory === cat.category ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>

                        {expandedCategory === cat.category && (
                            <div className="px-3 pb-3 space-y-3 border-t">
                                {cat.keys.map((key) => (
                                    <div key={key} className="space-y-1 pt-2">
                                        <Label
                                            htmlFor={key}
                                            className="text-xs font-mono text-muted-foreground"
                                        >
                                            {key}
                                        </Label>
                                        <Input
                                            id={key}
                                            type="password"
                                            placeholder="Optional"
                                            value={values[key] || ""}
                                            onChange={(e) =>
                                                handleChange(key, e.target.value)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={onSkip}
                    className="flex-1"
                    size="lg"
                >
                    Skip for now
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    size="lg"
                >
                    Save & Continue
                </Button>
            </div>
        </div>
    );
};
