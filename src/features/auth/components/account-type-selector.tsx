"use client";

import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountTypeSelectorProps {
    value: "PERSONAL" | "ORG";
    onChange: (value: "PERSONAL" | "ORG") => void;
    disabled?: boolean;
}

/**
 * Account Type Selector for Signup
 * 
 * WHY: Per spec, signup MUST require account type selection.
 * - PERSONAL: Single workspace, user-level billing
 * - ORG: Multiple workspaces, organization-level billing
 */
export const AccountTypeSelector = ({
    value,
    onChange,
    disabled,
}: AccountTypeSelectorProps) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange("PERSONAL")}
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    value === "PERSONAL"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <User className={cn(
                    "h-8 w-8 mb-2",
                    value === "PERSONAL" ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                    "font-medium text-sm",
                    value === "PERSONAL" ? "text-primary" : "text-foreground"
                )}>
                    Personal
                </span>
                <span className="text-xs text-muted-foreground mt-1 text-center">
                    Single workspace
                </span>
            </button>

            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange("ORG")}
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    value === "ORG"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <Building2 className={cn(
                    "h-8 w-8 mb-2",
                    value === "ORG" ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                    "font-medium text-sm",
                    value === "ORG" ? "text-primary" : "text-foreground"
                )}>
                    Organization
                </span>
                <span className="text-xs text-muted-foreground mt-1 text-center">
                    Multiple workspaces
                </span>
            </button>
        </div>
    );
};
