"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Mail, User, Calendar } from "lucide-react";
import { useUpdateProfile } from "../api/use-update-profile";
import { useUploadProfileImage } from "../api/use-upload-profile-image";
import { ChangePasswordModal } from "./change-password-modal";
import { Models } from "node-appwrite";
import { toast } from "sonner";

interface ProfileClientProps {
  initialData: Models.User<Models.Preferences>;
}

export const ProfileClient = ({ initialData }: ProfileClientProps) => {
  const [name, setName] = useState(initialData.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    initialData.prefs?.profileImageUrl ?? null
  );

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: uploadImage, isPending: isUploading } = useUploadProfileImage();

  const avatarFallback = initialData.name
    ? initialData.name.charAt(0).toUpperCase()
    : initialData.email.charAt(0).toUpperCase() ?? "U";

  const handleSave = () => {
    if (name.trim() === "") {
      toast.error("Name cannot be empty");
      return;
    }

    updateProfile(
      { name },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          setIsEditing(false);
        },
        onError: () => {
          toast.error("Failed to update profile");
        },
      }
    );
  };

  const handleCancel = () => {
    setName(initialData.name || "");
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[Profile Client] File selected:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error("[Profile Client] File too large:", file.size);
      toast.error("File size should be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("[Profile Client] Invalid file type:", file.type);
      toast.error("Please upload an image file");
      return;
    }

    console.log("[Profile Client] Starting upload...");
    uploadImage(
      { file },
      {
        onSuccess: (data) => {
          console.log("[Profile Client] Upload successful:", data);
          toast.success("Profile picture updated successfully");
          setProfileImageUrl(data.data.url);
        },
        onError: (error) => {
          console.error("[Profile Client] Upload failed:", error);
          toast.error("Failed to upload profile picture");
        },
      }
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="h-full w-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">
       


        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="size-24 border-2 border-neutral-300">
                {profileImageUrl && (
                  <AvatarImage src={profileImageUrl} alt={initialData.name} />
                )}
                <AvatarFallback className="bg-neutral-200 text-3xl font-medium text-neutral-500">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition"
              >
                {isUploading ? (
                  <Loader2 className="size-4 text-white animate-spin" />
                ) : (
                  <Camera className="size-4 text-white" />
                )}
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Click the camera icon to upload a new profile picture. Maximum file size is 2MB.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="size-4" />
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing || isUpdating}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="size-4" />
                Email Address
              </Label>
              <Input
                id="email"
                value={initialData.email}
                disabled
                className="bg-neutral-50"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed
              </p>
            </div>

            {isEditing ? (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="w-24"
                >
                  {isUpdating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="w-24">
                Edit
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account Information Section
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  User ID
                </Label>
                <p className="text-sm font-mono bg-neutral-50 p-2 rounded border">
                  {initialData.$id}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4" />
                  Account Created
                </Label>
                <p className="text-sm bg-neutral-50 p-2 rounded border">
                  {formatDate(initialData.$createdAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4" />
                  Last Updated
                </Label>
                <p className="text-sm bg-neutral-50 p-2 rounded border">
                  {formatDate(initialData.$updatedAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  Email Verification
                </Label>
                <p className="text-sm bg-neutral-50 p-2 rounded border">
                  {initialData.emailVerification ? (
                    <span className="text-green-600 font-medium">✓ Verified</span>
                  ) : (
                    <span className="text-amber-600 font-medium">⚠ Not Verified</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  className="bg-neutral-50"
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

            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" disabled>
                Enable 2FA (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card> */}

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
                className="bg-neutral-50 capitalize"
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
