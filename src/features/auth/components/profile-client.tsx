"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, User, Trash2, Shield, Camera } from "lucide-react";
import { useUpdateProfile } from "../api/use-update-profile";
import { useUploadProfileImage } from "../api/use-upload-profile-image";
import { useDeleteAccount } from "../api/use-delete-account";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { LinkedProviders } from "./linked-providers";
import { Models } from "node-appwrite";
import { toast } from "sonner";

interface ProfileClientProps {
  initialData: Models.User<Models.Preferences>;
}

export const ProfileClient = ({ initialData }: ProfileClientProps) => {
  const [name, setName] = useState(initialData.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    initialData.prefs?.profileImageUrl ?? null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: uploadImage, isPending: isUploading } = useUploadProfileImage();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();

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

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    uploadImage(
      { file },
      {
        onSuccess: (data) => {
          toast.success("Profile picture updated successfully");
          setProfileImageUrl(data.data.url);
        },
        onError: () => {
          toast.error("Failed to upload profile picture");
        },
      }
    );
  };

  const handleDeleteAccount = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        toast.success("Account deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete account");
        setIsDeleteDialogOpen(false);
      },
    });
  };

  return (
    <div className="h-full w-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">


        <div className="w-full p-5 rounded-xl border flex items-center justify-between">
          <div className="flex items-start gap-5">
            <div className="relative group">
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <label htmlFor="profile-image-upload" className="cursor-pointer">
                <Avatar className="size-24 border-2 border-neutral-300 transition-all group-hover:border-primary">
                  {profileImageUrl && (
                    <AvatarImage src={profileImageUrl} alt={initialData.name} />
                  )}
                  <AvatarFallback className="bg-neutral-200 text-3xl font-medium text-neutral-500">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="size-8 text-white" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="size-8 text-white animate-spin" />
                  </div>
                )}
              </label>
            </div>

            <div className="flex flex-col ">
              <h1 className="text-[22px] font-semibold">{initialData.name}</h1>
              <p className="text-[13px]">Team Manager</p>
              <p className="text-[13px]">{initialData.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <Card >
          <CardHeader className="mb-3">
            <CardTitle className=" !text-[18px]">Personal Information</CardTitle>
            <CardDescription className="!text-xs font-normal">
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

            <div className="space-y-2 !mb-5">
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
              <div className="flex gap-2 pt-2 mt-3">
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="text-xs font-medium px-6 rounded-sm py-3" size={"xs"}                >
                  {isUpdating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating} className="text-xs font-medium px-6 rounded-sm py-3" size={"xs"}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size={"xs"} className="text-xs font-medium px-6 rounded-sm py-3" onClick={() => setIsEditing(true)} >
                Edit
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account Information Section */}
        {/* <Card>
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
        </Card> */}

        {/* Security Section */}
        {/* <Card>
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

        {/* Linked Accounts Section */}
        <LinkedProviders />

        {/* Security Section */}
        <Card>
          <CardHeader className="mb-3">
            <CardTitle className="!text-[18px] flex items-center gap-2">
              <Shield className="size-5" />
              Security
            </CardTitle>
            <CardDescription className="!text-xs font-normal">
              Manage your account security and data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Delete Account Section */}
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-900">Delete Account</p>
                  <p className="text-xs text-red-700">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                  className="text-xs font-medium px-6 rounded-sm py-3"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteAccount}
        userId={initialData.$id}
        isPending={isDeleting}
      />

      {/* <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      /> */}
    </div>
  );
};
