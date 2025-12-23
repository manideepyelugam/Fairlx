"use client";

import { CreditCard, DollarSign, FileText, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface OrganizationBillingSettingsProps {
    organizationId: string;
    organizationName: string;
}

export function OrganizationBillingSettings({
    organizationId,
    organizationName,
}: OrganizationBillingSettingsProps) {
    // In real implementation, fetch billing data from API
    const hasPaymentMethod = false;
    const billingEmail = "billing@example.com";

    return (
        <div className="space-y-6">
            {/* Billing Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Billing Overview
                    </CardTitle>
                    <CardDescription>
                        Organization-level billing information and settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Billing Entity</Label>
                            <div className="flex items-center gap-2">
                                <Input value={organizationName} disabled className="flex-1" />
                                <Badge variant="default">Organization</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All workspaces in this organization share billing
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Organization ID</Label>
                            <Input value={organizationId} disabled className="font-mono text-sm" />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="billingEmail">Billing Email</Label>
                        <Input
                            id="billingEmail"
                            type="email"
                            defaultValue={billingEmail}
                            placeholder="billing@example.com"
                        />
                        <p className="text-xs text-muted-foreground">
                            Invoices and billing notifications will be sent to this email
                        </p>
                    </div>

                    <Button>Save Billing Settings</Button>
                </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                    </CardTitle>
                    <CardDescription>
                        Manage your organization's payment method
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {hasPaymentMethod ? (
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">Visa ending in 4242</div>
                                    <div className="text-sm text-muted-foreground">Expires 12/2025</div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">Update</Button>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground mb-4">
                                No payment method configured
                            </p>
                            <Button>Add Payment Method</Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Add a payment method to enable automatic billing
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Invoice History
                            </CardTitle>
                            <CardDescription>
                                View and download past invoices
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href="#">
                                View All Invoices
                                <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {/* Mock invoice data */}
                        {[
                            { id: "INV-2025-01", date: "2025-01-01", amount: "$129.50", status: "paid" },
                            { id: "INV-2024-12", date: "2024-12-01", amount: "$89.30", status: "paid" },
                            { id: "INV-2024-11", date: "2024-11-01", amount: "$115.75", status: "paid" },
                        ].map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                            >
                                <div className="flex items-center gap-4">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">{invoice.id}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {invoice.date}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="font-semibold">{invoice.amount}</div>
                                        <Badge variant="outline" className="text-xs">
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Usage Dashboard Link */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">View Detailed Usage</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Monitor your organization's usage metrics and costs
                            </p>
                        </div>
                        <Button asChild>
                            <a href="../admin/usage">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Usage Dashboard
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
