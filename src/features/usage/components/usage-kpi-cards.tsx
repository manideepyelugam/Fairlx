"use client";

import { Activity, HardDrive, Cpu, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UsageSummary } from "../types";

interface UsageKPICardsProps {
    summary: UsageSummary | null;
    isLoading: boolean;
}

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    className?: string;
}

function KPICard({ title, value, subtitle, icon, trend, trendValue, className }: KPICardProps) {
    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                            {trend && trendValue && (
                                <span
                                    className={cn(
                                        "flex items-center text-xs font-medium",
                                        trend === "up" && "text-emerald-600",
                                        trend === "down" && "text-red-600",
                                        trend === "neutral" && "text-muted-foreground"
                                    )}
                                >
                                    {trend === "up" ? (
                                        <TrendingUp className="h-3 w-3 mr-0.5" />
                                    ) : trend === "down" ? (
                                        <TrendingDown className="h-3 w-3 mr-0.5" />
                                    ) : null}
                                    {trendValue}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function UsageKPICards({ summary, isLoading }: UsageKPICardsProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-8 w-32 bg-muted rounded" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const formatNumber = (num: number, decimals = 2) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
        return num.toFixed(decimals);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
                title="Traffic Used"
                value={summary ? `${formatNumber(summary.trafficTotalGB)} GB` : "0 GB"}
                subtitle={summary ? `${formatNumber(summary.trafficTotalBytes)} bytes total` : undefined}
                icon={<Activity className="h-5 w-5" />}
                className="border-l-4 border-l-blue-500"
            />
            <KPICard
                title="Storage Used"
                value={summary ? `${formatNumber(summary.storageAvgGB)} GB` : "0 GB"}
                subtitle="Average this period"
                icon={<HardDrive className="h-5 w-5" />}
                className="border-l-4 border-l-amber-500"
            />
            <KPICard
                title="Compute Used"
                value={summary ? formatNumber(summary.computeTotalUnits, 0) : "0"}
                subtitle="Compute units"
                icon={<Cpu className="h-5 w-5" />}
                className="border-l-4 border-l-purple-500"
            />
            <KPICard
                title="Estimated Cost"
                value={summary ? formatCurrency(summary.estimatedCost.total) : "$0.00"}
                subtitle={
                    summary
                        ? `Traffic: ${formatCurrency(summary.estimatedCost.traffic)} | Storage: ${formatCurrency(summary.estimatedCost.storage)} | Compute: ${formatCurrency(summary.estimatedCost.compute)}`
                        : undefined
                }
                icon={<DollarSign className="h-5 w-5" />}
                className="border-l-4 border-l-emerald-500"
            />
        </div>
    );
}
