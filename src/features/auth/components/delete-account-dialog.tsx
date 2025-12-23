"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userId: string;
  isPending?: boolean;
}

export const DeleteAccountDialog = ({
  open,
  onOpenChange,
  onConfirm,
  userId,
  isPending = false,
}: DeleteAccountDialogProps) => {
  const [inputValue, setInputValue] = useState("");
  const isValid = inputValue === userId;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setInputValue("");
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleClose}>
      <Card className="w-full h-full border-0 shadow-none">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-6" />
            <CardTitle className="text-xl">Delete Account</CardTitle>
          </div>
          <CardDescription className="text-sm mt-2">
            This action cannot be undone. This will permanently delete your
            account and remove all your data including:
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>All workspaces you own</li>
              <li>All spaces and projects</li>
              <li>All tasks and related data</li>
              <li>All teams and programs</li>
              <li>All custom configurations</li>
              <li>Your profile and personal data</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId" className="text-sm font-medium">
              To confirm, please type your User ID below:
            </Label>
            <div className="p-3 bg-neutral-100 rounded border font-mono text-sm mb-2">
              {userId}
            </div>
            <Input
              id="userId"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your User ID"
              disabled={isPending}
              className="font-mono"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isValid || isPending}
              className="flex-1"
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ResponsiveModal>
  );
};
