"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Calendar } from "lucide-react";

import { Models } from "node-appwrite";

interface ProfileClientProps {
  initialData: Models.User<Models.Preferences>;
}

export const ProfileClient = ({ initialData }: ProfileClientProps) => {

  



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

       

      
      </div>
    </div>
  );
};
