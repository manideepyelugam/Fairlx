"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { ChangePasswordModal } from "./change-password-modal";
import { TwoFactorSettings } from "@/features/twoFactorAuth/components/two-factor-settings";
interface ProfileClientProps {
  initialData: {
    $id: string;
    email: string;
    registration?: string;
    prefs?: {
      twoFactorEnabled?: boolean;
      twoFactorMethod?: string;
      primaryOrganizationId?: string;
      [key: string]: unknown;
    };
  };
}

export const ProfileClient = ({ initialData }: ProfileClientProps) => {
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);



  return (
    <div className="h-full w-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">


        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value="••••••••"
                  disabled
                  className="bg-muted"
                />
                <Button
                  variant="outline"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                >
                  Change Password
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Last changed: Never
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
                <TwoFactorSettings user={initialData} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Registration Method</Label>
              <Input
                value={initialData.registration || "Email"}
                disabled
                className="bg-muted capitalize"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      />
    </div>
  );
};
