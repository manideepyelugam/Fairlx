"use client";

import { useState } from "react";
import { Plus, Trash2, Bell, Mail, Webhook, ToggleLeft, ToggleRight } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsageAlert, ResourceType, AlertType } from "../types";
import { useCreateUsageAlert, useUpdateUsageAlert, useDeleteUsageAlert } from "../api";

interface UsageAlertsManagerProps {
    alerts: UsageAlert[];
    workspaceId: string;
    isLoading: boolean;
}

const getAlertIcon = (type: AlertType) => {
    switch (type) {
        case AlertType.EMAIL:
            return <Mail className="h-4 w-4" />;
        case AlertType.IN_APP:
            return <Bell className="h-4 w-4" />;
        case AlertType.WEBHOOK:
            return <Webhook className="h-4 w-4" />;
    }
};

const formatThreshold = (threshold: number, resourceType: ResourceType) => {
    if (resourceType === ResourceType.COMPUTE) {
        return `${threshold.toLocaleString()} units`;
    }
    return `${threshold.toFixed(2)} GB`;
};

export function UsageAlertsManager({
    alerts,
    workspaceId,
    isLoading,
}: UsageAlertsManagerProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAlert, setNewAlert] = useState<{
        resourceType: ResourceType;
        threshold: number;
        alertType: AlertType;
        webhookUrl?: string;
    }>({
        resourceType: ResourceType.TRAFFIC,
        threshold: 10,
        alertType: AlertType.IN_APP,
    });

    const createAlert = useCreateUsageAlert();
    const updateAlert = useUpdateUsageAlert();
    const deleteAlert = useDeleteUsageAlert();

    const handleCreateAlert = async () => {
        await createAlert.mutateAsync({
            workspaceId,
            ...newAlert,
        });
        setIsCreateOpen(false);
        setNewAlert({
            resourceType: ResourceType.TRAFFIC,
            threshold: 10,
            alertType: AlertType.IN_APP,
        });
    };

    const handleToggleAlert = async (alert: UsageAlert) => {
        await updateAlert.mutateAsync({
            alertId: alert.$id,
            workspaceId,
            isEnabled: !alert.isEnabled,
        });
    };

    const handleDeleteAlert = async (alertId: string) => {
        if (confirm("Are you sure you want to delete this alert?")) {
            await deleteAlert.mutateAsync({ alertId, workspaceId });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Usage Alerts</CardTitle>
                        <CardDescription>
                            Get notified when usage exceeds thresholds
                        </CardDescription>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Alert
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Usage Alert</DialogTitle>
                                <DialogDescription>
                                    Set up a notification when resource usage exceeds a threshold
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Resource Type</Label>
                                    <Select
                                        value={newAlert.resourceType}
                                        onValueChange={(v) =>
                                            setNewAlert({ ...newAlert, resourceType: v as ResourceType })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ResourceType.TRAFFIC}>Traffic (GB)</SelectItem>
                                            <SelectItem value={ResourceType.STORAGE}>Storage (GB)</SelectItem>
                                            <SelectItem value={ResourceType.COMPUTE}>Compute (Units)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>
                                        Threshold{" "}
                                        {newAlert.resourceType === ResourceType.COMPUTE ? "(units)" : "(GB)"}
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={newAlert.threshold}
                                        onChange={(e) =>
                                            setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) || 0 })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Alert Type</Label>
                                    <Select
                                        value={newAlert.alertType}
                                        onValueChange={(v) =>
                                            setNewAlert({ ...newAlert, alertType: v as AlertType })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={AlertType.IN_APP}>In-App Notification</SelectItem>
                                            <SelectItem value={AlertType.EMAIL}>Email</SelectItem>
                                            <SelectItem value={AlertType.WEBHOOK}>Webhook</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newAlert.alertType === AlertType.WEBHOOK && (
                                    <div className="space-y-2">
                                        <Label>Webhook URL</Label>
                                        <Input
                                            type="url"
                                            placeholder="https://..."
                                            value={newAlert.webhookUrl || ""}
                                            onChange={(e) =>
                                                setNewAlert({ ...newAlert, webhookUrl: e.target.value })
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateAlert}
                                    disabled={createAlert.isPending}
                                >
                                    {createAlert.isPending ? "Creating..." : "Create Alert"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No alerts configured</p>
                        <p className="text-sm">Create an alert to get notified about usage thresholds</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.$id}
                                className="flex items-center justify-between p-4 rounded-lg border bg-card"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-muted">
                                        {getAlertIcon(alert.alertType)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium capitalize">
                                                {alert.resourceType}
                                            </span>
                                            <Badge variant={alert.isEnabled ? "default" : "secondary"}>
                                                {alert.isEnabled ? "Active" : "Disabled"}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Alert when exceeds{" "}
                                            {formatThreshold(alert.threshold, alert.resourceType)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleAlert(alert)}
                                        disabled={updateAlert.isPending}
                                    >
                                        {alert.isEnabled ? (
                                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteAlert(alert.$id)}
                                        disabled={deleteAlert.isPending}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
