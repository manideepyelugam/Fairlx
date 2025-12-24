"use client";

import { useState } from "react";
import { AlertTriangle, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/**
 * Conversion Confirmation Dialog
 * 
 * Problem: Conversion is irreversible but feels unsafe to users.
 * 
 * Fix: Require typing "ORGANIZATION" to confirm with clear checklist.
 */

interface ConversionConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

const CONFIRMATION_TEXT = "ORGANIZATION";

export const ConversionConfirmationDialog = ({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: ConversionConfirmationDialogProps) => {
    const [inputValue, setInputValue] = useState("");
    const isConfirmEnabled = inputValue === CONFIRMATION_TEXT;

    const handleConfirm = () => {
        if (isConfirmEnabled) {
            onConfirm();
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setInputValue(""); // Reset on close
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Convert to Organization
                    </DialogTitle>
                    <DialogDescription>
                        This action is permanent and cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Checklist */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">What will happen:</h4>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Your workspace and projects remain unchanged</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>No data will be deleted</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>Future billing moves to organization</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">
                                    This action cannot be undone
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation input */}
                    <div className="space-y-2 pt-2">
                        <Label htmlFor="confirmation">
                            Type <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span> to confirm
                        </Label>
                        <Input
                            id="confirmation"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type here to confirm"
                            autoComplete="off"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!isConfirmEnabled || isLoading}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {isLoading ? "Converting…" : "Convert to Organization"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
